// 上传图片品类识别（纯前端）：
// 1) 先用文件名 + 画面动态描述里的品类词命中；
// 2) 没命中就看图片主色相，按色环距离匹配农产品目录里的色相中心；
// 3) 都不像就落到“时令鲜货”通用模板。
import { products } from '../data/products'

const norm = s => String(s || '').toLowerCase()

function hueDistance(a, b) {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const remote = typeof source === 'string'
    const url = remote ? source : URL.createObjectURL(source)
    const img = new Image()
    img.onload = () => { if (!remote) URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { if (!remote) URL.revokeObjectURL(url); reject(new Error('图片解码失败')) }
    img.src = url
  })
}

/** 取画面中心 70% 区域的主色相（0-360），太灰/太暗/没颜色时返回 null */
async function dominantHue(file) {
  const img = await loadImage(file)
  const N = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = N
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const sw = img.width * 0.7, sh = img.height * 0.7
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, N, N)
  const { data } = ctx.getImageData(0, 0, N, N)

  const bins = new Float64Array(36) // 每 10° 一个桶
  let colored = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    const l = (max + min) / 2
    const d = max - min
    if (d < 0.1 || l < 0.12 || l > 0.94) continue
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (s < 0.28) continue
    let h
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
    bins[Math.floor(h / 10) % 36] += s
    colored++
  }
  if (colored < 60) return null

  let peak = 0
  for (let i = 1; i < 36; i++) if (bins[i] > bins[peak]) peak = i

  // 峰值附近做“环形”平均：±2 个桶，角度相对峰值展开，
  // 这样 0°/360° 附近的红色（苹果）不会被平均成偏黄绿
  const peakAngle = peak * 10 + 5
  let sx = 0, sy = 0, weight = 0
  for (let k = -2; k <= 2; k++) {
    const i = (peak + k + 36) % 36
    const w = bins[i]
    if (!w) continue
    const rel = ((i * 10 + 5 - peakAngle) * Math.PI) / 180
    sx += Math.cos(rel) * w
    sy += Math.sin(rel) * w
    weight += w
  }
  if (!weight) return null
  const delta = (Math.atan2(sy, sx) * 180) / Math.PI
  return (peakAngle + delta + 360) % 360
}

/**
 * 识别上传图片对应的农产品
 * @param {File} file 用户上传的图片
 * @param {string} hint 画面动态描述等文本线索
 * @returns {Promise<{id: string, by: 'text'|'color'|'fallback'}>}
 */
export async function detectProduct(file, hint = '') {
  const name = typeof file === 'string' ? '' : String(file?.name || '')
  const text = norm(`${name} ${hint}`)
  const byText = products.find(p => p.keywords.some(k => text.includes(k)))
  if (byText) return { id: byText.id, by: 'text' }

  let hue = null
  try { hue = await dominantHue(file) } catch { hue = null }
  if (hue == null) return { id: 'fresh', by: 'fallback' }

  let best = null, bestD = Infinity
  for (const p of products) {
    if (p.hue == null) continue
    const d = hueDistance(hue, p.hue)
    if (d < bestD) { bestD = d; best = p }
  }
  if (best && bestD <= 26) return { id: best.id, by: 'color' }
  return { id: 'fresh', by: 'color' }
}

/**
 * 旧作品补品类：只用“很确定”的颜色区间（黄→香蕉、红→苹果、橙→柑橘），
 * 其余一律落到通用“时令鲜货”，避免把其他东西误判成猕猴桃/茶叶而套错素材。
 */
export async function detectProductSafe(source) {
  let hue = null
  try { hue = await dominantHue(source) } catch { hue = null }
  if (hue == null) return 'fresh'
  if (hue >= 42 && hue <= 64) return 'banana'
  if (hue >= 340 || hue <= 14) return 'apple'
  if (hue > 18 && hue <= 36) return 'orange'
  return 'fresh'
}
