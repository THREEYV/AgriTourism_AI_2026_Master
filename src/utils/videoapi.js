// 用用户接入的 API 真实生成视频（异步任务：提交 → 轮询 → 拿视频地址）
// 目前支持：火山方舟 Seedance、MiniMax 海螺、以及返回 { id } + { status, url } 的通用视频接口
import { apiBase, request } from './llm'

const sleep = (ms, signal) => new Promise((resolve, reject) => {
  const timer = setTimeout(resolve, ms)
  if (signal) {
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('已取消', 'AbortError'))
    }, { once: true })
  }
})

export function videoCapability(cfg) {
  if (!cfg?.baseUrl || !cfg?.apiKey) return { supported: false, label: '未接入 API' }
  const base = apiBase(cfg)
  const model = String(cfg.model || '').toLowerCase()
  if (/ark\.cn-|volces\.com/.test(base) || /seedance|doubao[-\w]*video|t2v|i2v/.test(model)) {
    return { supported: true, provider: 'ark', label: '火山方舟 · Seedance' }
  }
  if (/minimax/.test(base) || /hailuo|minimax.*video/.test(model)) {
    return { supported: true, provider: 'minimax', label: 'MiniMax · 海螺' }
  }
  if (/openai/.test(base) || /sora|video-1/.test(model)) {
    return { supported: true, provider: 'openai', label: 'OpenAI · 视频' }
  }
  return { supported: false, label: '当前 API 未提供视频任务接口' }
}

function phaseText(status = '') {
  const s = String(status).toLowerCase()
  if (!s) return '处理中…'
  if (/queue|pending|submitted|排队/.test(s)) return '任务排队中…'
  if (/run|process|generat|生成|processing/.test(s)) return '正在生成画面…'
  if (/success|succeed|complete|done|完成/.test(s)) return '正在取回视频…'
  return `处理中（${status}）`
}

const isDone = s => /success|succeed|complete|done/i.test(String(s))
const isFail = s => /fail|error|cancel/i.test(String(s))

/**
 * 生成一段真实视频，返回可播放的视频地址
 * @param {object} cfg 自定义 API 配置
 * @param {{prompt:string, image?:string, ratio?:string, duration?:string}} input
 * @param {{onStatus?:Function, signal?:AbortSignal}} opts
 */
export async function generateRealVideo(cfg, { prompt, image, ratio = '9:16', duration = '15 秒' }, { onStatus = () => {}, signal } = {}) {
  const cap = videoCapability(cfg)
  if (!cap.supported) throw new Error('当前 API 不支持视频生成（支持：火山方舟 Seedance / MiniMax 海螺 / OpenAI 视频）')

  const sec = Math.min(10, Math.max(5, parseInt(duration, 10) || 5))
  const text = [
    String(prompt || '').trim(),
    `画面比例 ${ratio}，时长约 ${sec} 秒；抖音助农带货宣传片风格，真实实拍质感，镜头稳定，主体清晰`
  ].filter(Boolean).join('\n')

  if (cap.provider === 'ark') return arkVideo(cfg, { text, image, ratio, sec, onStatus, signal })
  if (cap.provider === 'minimax') return minimaxVideo(cfg, { text, image, sec, onStatus, signal })
  return genericVideo(cfg, { text, ratio, onStatus, signal })
}

async function poll(fetchStatus, { onStatus, signal, timeoutMs = 10 * 60 * 1000, intervalMs = 5000 }) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (signal?.aborted) throw new DOMException('已取消', 'AbortError')
    const st = await fetchStatus()
    onStatus({ phase: st.status || '', message: phaseText(st.status), elapsed: Date.now() - started })
    if (st.url) return st.url
    if (isFail(st.status)) throw new Error(st.message || '视频生成失败')
    await sleep(intervalMs, signal)
  }
  throw new Error('视频生成超时（超过 10 分钟），请稍后重试')
}

// —— 火山方舟 Seedance ——
async function arkVideo(cfg, { text, image, ratio, sec, onStatus, signal }) {
  const base = apiBase(cfg)
  const content = [{ type: 'text', text: `${text} --ratio ${ratio} --duration ${sec}` }]
  if (image) content.push({ type: 'image_url', image_url: { url: image } })

  onStatus({ phase: 'submitting', message: '正在提交视频任务…' })
  const created = await request(cfg, '/contents/generations/tasks', {
    method: 'POST',
    payload: { model: cfg.model, content },
    timeout: 60000
  })
  const id = created?.id || created?.task_id || created?.data?.id
  if (!id) throw new Error('视频接口没有返回任务 ID')

  return poll(async () => {
    const d = await request(cfg, `/contents/generations/tasks/${encodeURIComponent(id)}`, { method: 'GET', timeout: 30000 })
    return {
      status: d?.status || d?.data?.status,
      url: d?.content?.video_url || d?.result?.video_url || d?.video_url || d?.data?.content?.video_url,
      message: d?.error?.message
    }
  }, { onStatus, signal })
}

// —— MiniMax 海螺 ——
async function minimaxVideo(cfg, { text, image, sec, onStatus, signal }) {
  const base = apiBase(cfg)
  const payload = {
    model: cfg.model || 'MiniMax-Hailuo-02',
    prompt: text,
    duration: sec >= 10 ? 10 : 6,
    resolution: '1080P'
  }
  if (image) payload.first_frame_image = image

  onStatus({ phase: 'submitting', message: '正在提交视频任务…' })
  const created = await request(cfg, '/video_generation', { method: 'POST', payload, timeout: 60000 })
  const id = created?.task_id || created?.data?.task_id
  if (!id) throw new Error('MiniMax 没有返回 task_id')

  let fileId = ''
  const url = await poll(async () => {
    const d = await request(cfg, `/query/video_generation?task_id=${encodeURIComponent(id)}`, { method: 'GET', timeout: 30000 })
    const status = d?.status || d?.data?.status
    fileId = d?.file_id || d?.data?.file_id || fileId
    return { status, url: d?.download_url || d?.data?.download_url, message: d?.base_resp?.status_msg }
  }, { onStatus, signal })
  if (url) return url
  if (!fileId) throw new Error('MiniMax 任务成功但没有返回文件 ID')

  onStatus({ phase: 'fetching', message: '正在取回视频…' })
  const file = await request(cfg, `/files/retrieve?file_id=${encodeURIComponent(fileId)}`, { method: 'GET', timeout: 30000 })
  const download = file?.file?.download_url || file?.data?.file?.download_url
  if (!download) throw new Error('取回视频失败：没有 download_url')
  return download
}

// —— 通用：POST {base}/videos → { id }，GET {base}/videos/{id} → { status, url } ——
async function genericVideo(cfg, { text, ratio, onStatus, signal }) {
  const base = apiBase(cfg)
  const size = ratio === '16:9' ? '1280x720' : ratio === '1:1' ? '1024x1024' : '720x1280'
  onStatus({ phase: 'submitting', message: '正在提交视频任务…' })
  const created = await request(cfg, '/videos', { method: 'POST', payload: { model: cfg.model, prompt: text, size }, timeout: 60000 })
  const id = created?.id || created?.task_id
  if (!id) throw new Error('视频接口没有返回任务 ID')

  return poll(async () => {
    const d = await request(cfg, `/videos/${encodeURIComponent(id)}`, { method: 'GET', timeout: 30000 })
    return { status: d?.status, url: d?.url || d?.video_url || d?.output?.url, message: d?.error?.message }
  }, { onStatus, signal })
}
