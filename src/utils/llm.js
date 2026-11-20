// 真实调用用户自定义的 OpenAI 兼容 API（POST {base}/chat/completions）
// 浏览器直连失败（跨域/网络）时会自动尝试本机代理 npm run proxy

const PROXY = 'http://127.0.0.1:8787'

export const apiBase = cfg => String(cfg?.baseUrl || '').trim().replace(/\/+$/, '')
export const apiReady = cfg => !!(cfg && apiBase(cfg) && cfg.apiKey && cfg.model)

export async function request(cfg, path, { method = 'POST', payload, timeout = 60000 } = {}) {
  const base = apiBase(cfg)
  if (!base) throw new Error('未填写 API Base URL')
  if (!cfg.apiKey) throw new Error('未填写 API Key')

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  const headers = { Authorization: `Bearer ${cfg.apiKey}` }
  if (payload !== undefined) headers['Content-Type'] = 'application/json'
  const body = payload === undefined ? undefined : JSON.stringify(payload)

  try {
    let res
    try {
      res = await fetch(`${base}${path}`, { method, headers, body, signal: ctrl.signal })
    } catch (e) {
      if (e?.name === 'AbortError') throw new Error('请求超时')
      // 多半是浏览器跨域被拦截，走本机代理再试一次
      try {
        res = await fetch(`${PROXY}${path}`, {
          method,
          headers: { ...headers, 'x-llm-target': base },
          body,
          signal: ctrl.signal
        })
      } catch (e2) {
        if (e2?.name === 'AbortError') throw new Error('请求超时')
        throw new Error('请求失败：可能是跨域限制或地址不可达（可先运行 npm run proxy 走本地代理）')
      }
    }

    const text = await res.text()
    let data = null
    try { data = text ? JSON.parse(text) : null } catch {}
    if (!res.ok) {
      const msg = data?.error?.message || data?.message || text.slice(0, 140)
      throw new Error(`HTTP ${res.status}${msg ? ' · ' + msg : ''}`)
    }
    return data
  } finally {
    clearTimeout(timer)
  }
}

/** 拉取服务商支持的模型列表（GET {base}/models） */
export async function listModels(cfg) {
  const data = await request(cfg, '/models', { method: 'GET', timeout: 30000 })
  const arr = Array.isArray(data?.data) ? data.data
    : Array.isArray(data?.models) ? data.models
      : Array.isArray(data) ? data
        : []
  const ids = arr
    .map(m => (typeof m === 'string' ? m : m?.id || m?.name || ''))
    .map(s => String(s).trim())
    .filter(Boolean)
  // 有些网关会把模型挂在 data.models[].id 里，这里统一去重排序
  return [...new Set(ids)].sort((a, b) => a.localeCompare(b))
}

export async function chat(cfg, messages, opts = {}) {
  const data = await request(cfg, '/chat/completions', {
    method: 'POST',
    payload: {
      model: cfg.model,
      messages,
      temperature: opts.temperature ?? 0.7,
      stream: false
    },
    timeout: opts.timeout ?? 60000
  })
  const c = data?.choices?.[0]?.message?.content
  const text = typeof c === 'string' ? c : Array.isArray(c) ? c.map(x => x?.text || '').join('') : ''
  if (!text.trim()) throw new Error('模型没有返回文本内容')
  return text
}

/** 测试连接：返回耗时（毫秒），失败时抛错 */
export async function testConnection(cfg) {
  const t0 = performance.now()
  await chat(cfg, [{ role: 'user', content: '只回复 ok' }], { temperature: 0, timeout: 20000 })
  return Math.round(performance.now() - t0)
}

const SYSTEM = '你是抖音助农短视频编导，只输出 JSON，不要任何解释或多余文字。'

function parseJSON(text) {
  const s = String(text).replace(/```json/gi, '```').replace(/```/g, '').trim()
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('模型返回的不是 JSON')
  return JSON.parse(s.slice(start, end + 1))
}

function normalizeScript(j) {
  const clean = v => String(v ?? '').replace(/^[#\s]+/, '').trim()
  const captions = Array.isArray(j.captions) ? j.captions.map(clean).filter(Boolean).slice(0, 8) : []
  if (!captions.length) throw new Error('模型没有返回字幕')
  return {
    product: clean(j.product).slice(0, 12),
    headline: clean(j.headline).slice(0, 40),
    captions,
    tags: Array.isArray(j.tags) ? j.tags.map(clean).filter(Boolean).slice(0, 3) : [],
    price: j.price != null ? String(j.price).replace(/[^\d.]/g, '').slice(0, 8) : '',
    spec: clean(j.spec).slice(0, 12)
  }
}

/**
 * 让模型写一版抖音带货分镜文案
 * @param {object} cfg 自定义 API 配置
 * @param {{mode:string, prompt:string, image?:string, product?:string}} input
 */
export async function generateScript(cfg, { mode, prompt, image, product }) {
  const brief = [
    product ? `产品：${product}` : '',
    prompt ? `用户描述：${prompt}` : '',
    mode === 'image' ? '另外上传了一张产品实拍图，请先识别图里的农产品。' : ''
  ].filter(Boolean).join('\n')

  const ask = `请为这条${mode === 'image' ? '图生视频' : '文生视频'}写分镜文案，输出 JSON：
{"product":"识别到的农产品名称，如 香蕉","headline":"花字标题，两行，用\\n分隔，每行不超过8个字","captions":["6条字幕，每条不超过14字，重点词用【】括起来"],"tags":["3个话题，不带#号"],"price":"建议售价，如 19.9","spec":"规格，如 5斤装"}
要求：口语化、有抖音带货节奏，字幕按“钩子-产地-卖点-过程-品质-下单”排列。`

  const withImage = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: [{ type: 'text', text: `${brief}\n\n${ask}` }, { type: 'image_url', image_url: { url: image } }] }
  ]
  const textOnly = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: `${brief}\n\n${ask}` }
  ]

  let text
  try {
    text = await chat(cfg, image ? withImage : textOnly, { temperature: 0.8, timeout: 90000 })
  } catch (e) {
    if (!image) throw e
    // 有些模型不支持图片输入，退化成纯文本再试一次
    text = await chat(cfg, textOnly, { temperature: 0.8, timeout: 90000 })
  }
  return normalizeScript(parseJSON(text))
}

const REPORT_SYSTEM = '你是乡村振兴与农文旅产业分析师，只输出 JSON，不要任何解释。'

function normalizeReport(j) {
  const title = String(j?.title || '').trim().slice(0, 40) || '产业发展分析报告'
  const summary = String(j?.summary || '').trim().slice(0, 220)
  const sections = (Array.isArray(j?.sections) ? j.sections : [])
    .map(s => Array.isArray(s)
      ? [String(s[0] || '').trim(), String(s[1] || '').trim()]
      : [String(s?.title || s?.heading || '').trim(), String(s?.content || s?.body || '').trim()])
    .filter(([h, body]) => h && body)
    .slice(0, 8)
  if (sections.length < 2) throw new Error('模型返回的报告结构不完整')
  return { title, summary, sections }
}

/**
 * 用用户接入的模型生成“行业分析”报告
 * @param {object} cfg 自定义 API 配置
 * @param {{kind?: 'agri'|'tourism', form?: object}} input
 */
export async function generateReport(cfg, { kind = 'agri', form = {} } = {}) {
  const isTourism = kind === 'tourism'
  const brief = isTourism
    ? [
        `目的地：${[form.province, form.city, form.spot].filter(Boolean).join(' · ') || '未填写'}`,
        `关注方向：${(Array.isArray(form.focus) ? form.focus : []).join('、') || '文旅融合'}`
      ].join('\n')
    : [
        `地区：${[form.province, form.city, form.area].filter(Boolean).join(' · ') || '未填写'}`,
        `产业：${form.industry || '未填写'}`,
        `经营规模：${form.scale || '未填写'}`,
        `当前问题：${form.problem || '未填写'}`,
        `发展目标：${form.goal || '未填写'}`
      ].join('\n')

  const ask = `请基于以上信息写一份${isTourism ? '文旅融合发展' : '农业产业发展'}分析报告，输出 JSON：
{"title":"报告标题（包含地区名）","summary":"80字以内的总体判断","sections":[["小标题","120字左右的建议正文"]]}
要求：sections 共 5 条，标题精炼；建议要结合用户填写的地区与产业，可执行、分步骤；不要编造具体统计数字；不要输出 JSON 之外的内容。`

  const text = await chat(cfg, [
    { role: 'system', content: REPORT_SYSTEM },
    { role: 'user', content: `${brief}\n\n${ask}` }
  ], { temperature: 0.6, timeout: 90000 })

  return normalizeReport(parseJSON(text))
}
