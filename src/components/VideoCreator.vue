<script setup>
// 统一的视频创作模块：助农 / 文旅 / AI 视频工厂共用
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Clapperboard, ImagePlus, Type, WandSparkles, Trash2, Heart, CheckCircle2, ChevronRight, ChevronDown, Check, LoaderCircle, Music, Lightbulb, Play, Sparkles, Info, PlugZap } from 'lucide-vue-next'
import MockPlayer from './MockPlayer.vue'
import VideoCover from './VideoCover.vue'
import VideoPlayerModal from './VideoPlayerModal.vue'
import VideoProgress from './VideoProgress.vue'
import { templates as allTemplates, videoView, plain, statsOf, photo, tplCover, shotMs } from '../data/templates'
import { credits } from '../data/credits'
import { products } from '../data/products'
import { detectProduct } from '../utils/vision'
import { generateScript } from '../utils/llm'
import { generateRealVideo, videoCapability } from '../utils/videoapi'
import { useAppStore } from '../stores/app'
import { toast } from '../utils/toast'

const props = defineProps({
  templates: { type: Array, required: true },
  initialTemplate: String,
  filterKinds: Boolean,
  accent: { type: String, default: 'green' }
})
const store = useAppStore(), router = useRouter()

// —— 模式与模板 ——
const mode = ref('template')
const kindFilter = ref('全部')
const visibleTemplates = computed(() => kindFilter.value === '全部' ? props.templates : props.templates.filter(t => t.kind === kindFilter.value))
const pick = name => props.templates.find(t => t.name === name) || props.templates[0]
const selected = ref(pick(props.initialTemplate))
const prompt = ref(selected.value.prompt)
const ratio = ref(selected.value.ratio), duration = ref(selected.value.duration), style = ref(selected.value.style)
const layout = ref(selected.value.layout), bgm = ref(selected.value.bgm)
const curScene = ref(0), player = ref(null), showCredits = ref(false)

function choose(t) {
  selected.value = t
  prompt.value = t.prompt
  ratio.value = t.ratio; duration.value = t.duration; style.value = t.style
  layout.value = t.layout; bgm.value = t.bgm
  curScene.value = 0
}
watch(() => props.initialTemplate, n => { if (n) { mode.value = 'template'; choose(pick(n)) } })

// 样片使用的版式 / 配乐跟随下方标签的选择
const previewMeta = computed(() => ({ ...selected.value, layout: layout.value, bgm: bgm.value }))
const previewMs = computed(() => shotMs(duration.value, selected.value.scenes.length))

// —— 样片下方的参数标签：点击弹出选项，与下方表单联动 ——
const LAYOUT_NAMES = { ecom: '带货种草', vlog: '打卡探店', story: '纪实故事' }
const BGMS = [...new Set(allTemplates.map(t => t.bgm))]
const STYLES = ['清新自然', '电影质感', '活力宣传', '纪实风格', '国风人文']
const openChip = ref('')
const chips = computed(() => [
  { key: 'layout', name: '版式', label: LAYOUT_NAMES[layout.value], dark: true, value: layout.value, set: v => { layout.value = v },
    options: Object.entries(LAYOUT_NAMES).map(([v, l]) => ({ v, l })) },
  { key: 'bgm', name: '配乐', label: bgm.value, icon: Music, grid: true, value: bgm.value, set: v => { bgm.value = v },
    options: BGMS.map(v => ({ v, l: v })) },
  { key: 'ratio', name: '画幅', label: ratio.value, value: ratio.value, set: v => { ratio.value = v },
    options: [['9:16', '9:16 竖屏'], ['16:9', '16:9 横屏'], ['1:1', '1:1 方形']].map(([v, l]) => ({ v, l })) },
  { key: 'duration', name: '时长', label: duration.value, value: duration.value, set: v => { duration.value = v },
    options: ['5 秒', '10 秒', '15 秒', '30 秒'].map(v => ({ v, l: v })) },
  { key: 'style', name: '风格调色', label: style.value, value: style.value, set: v => { style.value = v },
    options: STYLES.map(v => ({ v, l: v })) }
])
// 根据标签在屏幕上的位置决定菜单向右还是向左展开，避免超出屏幕
const menuRight = ref(false)
function toggleChip(c, e) {
  if (openChip.value === c.key) { openChip.value = ''; return }
  const r = e.currentTarget.getBoundingClientRect()
  menuRight.value = r.left + (c.grid ? 232 : 150) > window.innerWidth - 8
  openChip.value = c.key
}
function pickChip(c, v) { c.set(v); openChip.value = '' }
const closeChip = () => { openChip.value = '' }
onMounted(() => document.addEventListener('click', closeChip))
onBeforeUnmount(() => document.removeEventListener('click', closeChip))

function toggleTplFav(t) {
  const on = store.toggleFav({ kind: 'template', refId: t.name, title: t.name, sub: `${t.kind}模板 · ${t.desc}` })
  toast(on ? `已收藏模板「${t.name}」` : '已取消收藏')
}

// 文生视频的示例描述
const examples = computed(() => props.templates.slice(0, 3).map(t => t.prompt))

// —— 图片上传（压缩成缩略图，便于本地保存）——
const file = ref(null), preview = ref('')
// 识别到的农产品：决定成片的文案、价格、小黄车和实拍素材（只在助农场景启用）
const productId = ref(''), detecting = ref(false)
const isAgri = computed(() => (props.templates[0]?.kind || '助农') !== '文旅')
const product = computed(() => products.find(p => p.id === productId.value) || null)
// 产地 / 规格 / 价格：按识别品类自动填默认值，用户可以改，改完会同步到成片
const specOverride = ref(''), priceOverride = ref(''), originOverride = ref('')
watch(product, p => {
  specOverride.value = p ? p.spec : ''
  priceOverride.value = p ? p.price : ''
  originOverride.value = p ? p.origin : ''
}, { immediate: true })
async function upload(e) {
  const f = e.target.files?.[0]
  if (!f) return
  if (preview.value) URL.revokeObjectURL(preview.value)
  file.value = f
  preview.value = URL.createObjectURL(f)
  productId.value = ''
  if (!isAgri.value) return
  detecting.value = true
  const res = await detectProduct(f, prompt.value)
  productId.value = res.id
  detecting.value = false
  const p = products.find(x => x.id === res.id)
  toast(`识别到：${p.emoji} ${p.name}（识别不准可在下方修改）`, 'info', 3200)
}
function clearFile() {
  if (preview.value) URL.revokeObjectURL(preview.value)
  file.value = null
  preview.value = ''
  productId.value = ''
}
function toThumb(f) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const s = Math.min(1, 480 / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      resolve(c.toDataURL('image/jpeg', 0.72))
    }
    img.onerror = () => resolve('')
    img.src = URL.createObjectURL(f)
  })
}

// —— 生成 ——
const steps = ['解析创意描述', '生成分镜画面', '合成字幕与配乐', '渲染输出成片']
const generating = ref(false), progress = ref(0), apiCalling = ref(false)
const api = computed(() => store.activeApi)
const cap = computed(() => videoCapability(api.value))
// 文案方式：本地文案（不调用模型） / API 模型生成（未接入时不可选）
const copyMode = ref(api.value ? 'api' : 'local')
const copyTouched = ref(false)
function setCopyMode(m) { copyMode.value = m; copyTouched.value = true }
watch(api, v => {
  if (!v) { copyMode.value = 'local'; copyTouched.value = false }
  else if (!copyTouched.value) copyMode.value = 'api'
})
// 成片方式：本地合成（秒级） / 调用 API 真实生成（较慢）
const videoMode = ref('local')
const videoTask = ref({ open: false, elapsed: 0, message: '', error: '' })
let taskAbort = null
watch(cap, c => { if (!c.supported) videoMode.value = 'local' })
const stepText = computed(() => apiCalling.value ? '调用大模型生成文案…' : steps[Math.min(Math.floor(progress.value / 25), 3)])
let timer = null
onBeforeUnmount(() => { clearInterval(timer); taskAbort?.abort?.() })

function cancelVideoTask() { taskAbort?.abort?.() }

// 调用用户接入的视频接口生成真实视频（异步任务，通常 1–5 分钟）
async function generateWithApi() {
  const cfg = store.activeApi
  if (!cfg) { toast('请先接入 API', 'info'); return }
  if (mode.value === 'image' && !file.value) { toast('请先上传一张图片', 'info'); return }
  if (mode.value === 'image' && isAgri.value && !productId.value) { toast('正在识别图片内容，请稍候再试', 'info'); return }
  if (mode.value === 'text' && !prompt.value.trim()) { toast('请先填写视频创意描述', 'info'); return }

  const started = Date.now()
  const tick = setInterval(() => { videoTask.value.elapsed = Math.floor((Date.now() - started) / 1000) }, 1000)
  const ctrl = new AbortController()
  taskAbort = ctrl
  videoTask.value = { open: true, elapsed: 0, message: '正在提交视频任务…', error: '' }

  try {
    const thumb = mode.value === 'image' ? await toThumb(file.value) : ''
    const prod = product.value
    const fullPrompt = [
      prompt.value,
      prod ? `产品：${prod.name}（${prod.spec}），产地 ${prod.origin}` : '',
      '画面真实、镜头稳定、有产地实拍感'
    ].filter(Boolean).join('\n')

    const url = await generateRealVideo(cfg, {
      prompt: fullPrompt,
      image: thumb,
      ratio: ratio.value,
      duration: duration.value
    }, {
      signal: ctrl.signal,
      onStatus: s => { videoTask.value.message = s.message || s.phase || '处理中…' }
    })

    const tpl = selected.value
    const rec = store.addVideo({
      title: mode.value === 'template' ? tpl.name
        : prod ? `${prod.name} · ${specOverride.value || prod.spec}`
          : (prompt.value.split(/[，,。\n]/)[0].slice(0, 20) || 'AI 视频'),
      type: mode.value === 'template' ? '模板创作' : mode.value === 'text' ? '文生视频' : '图生视频',
      template: mode.value === 'template' ? tpl.name : undefined,
      baseTemplate: tpl.name, kind: tpl.kind,
      videoUrl: url, videoModel: cfg.model,
      thumb: mode.value === 'image' ? thumb : undefined,
      productId: isAgri.value && prod ? prod.id : undefined,
      productOverride: isAgri.value && prod ? { spec: specOverride.value.trim(), price: priceOverride.value.trim(), origin: originOverride.value.trim() } : undefined,
      prompt: prompt.value, ratio: ratio.value, duration: duration.value, style: style.value,
      status: '已完成'
    })
    videoTask.value.open = false
    toast('真实视频生成完成')
    playing.value = rec
  } catch (e) {
    if (e?.name === 'AbortError' || ctrl.signal.aborted) {
      videoTask.value.open = false
      toast('已取消生成', 'info')
      return
    }
    videoTask.value.error = e.message
  } finally {
    clearInterval(tick)
    taskAbort = null
  }
}

async function generate() {
  if (videoMode.value === 'api' && cap.value.supported) { await generateWithApi(); return }
  if (mode.value === 'image' && !file.value) { toast('请先上传一张图片', 'info'); return }
  if (mode.value === 'image' && isAgri.value && !productId.value) { toast('正在识别图片内容，请稍候再试', 'info'); return }
  if (mode.value === 'text' && !prompt.value.trim()) { toast('请先填写视频创意描述', 'info'); return }

  const cfg = store.activeApi
  if (!cfg) toast('未接入自定义 API：本次为本地演示成片，体验不完整', 'info', 3800)

  generating.value = true; progress.value = 0
  const thumbPromise = mode.value === 'image' ? toThumb(file.value) : Promise.resolve('')

  // 只有选择“API 模型生成文案”时才调用模型；否则用本地模板文案
  const scriptTask = (async () => {
    if (!cfg || copyMode.value !== 'api') return null
    try {
      const image = mode.value === 'image' ? await thumbPromise : ''
      apiCalling.value = true
      toast(`正在调用 ${cfg.model} 生成文案…`, 'info', 2600)
      return await generateScript(cfg, { mode: mode.value, prompt: prompt.value, image, product: product.value?.name })
    } catch (e) {
      toast(`AI 调用失败：${e.message}（已回退到本地文案）`, 'info', 4500)
      return null
    } finally {
      apiCalling.value = false
    }
  })()

  await new Promise(r => { timer = setInterval(() => { progress.value = Math.min(86, progress.value + 4); if (progress.value >= 86) { clearInterval(timer); r() } }, 90) })
  const script = await scriptTask
  progress.value = 94
  await new Promise(r => setTimeout(r, 220))
  progress.value = 100

  const tpl = selected.value
  let prod = product.value
  if (script?.product) {
    // 让模型识别的品类优先，识别不到就用通用“时令鲜货”，避免套错素材
    const hit = products.find(p => p.name === script.product || p.keywords.some(k => script.product.includes(k)))
    prod = hit || products.find(p => p.id === 'fresh')
    if (isAgri.value && prod) productId.value = prod.id
  }
  const withProduct = isAgri.value && prod && (mode.value === 'image' || mode.value === 'template' || !!script)
  const thumb = await thumbPromise
  const rec = store.addVideo({
    title: mode.value === 'template'
      ? (withProduct ? `${prod.name} · ${tpl.name}` : tpl.name)
      : withProduct ? `${prod.name} · ${specOverride.value || prod.spec}`
        : (script?.headline?.replace(/\n/g, '') || prompt.value.split(/[，,。\n]/)[0].slice(0, 20) || 'AI 创意视频'),
    type: mode.value === 'template' ? '模板创作' : mode.value === 'text' ? '文生视频' : '图生视频',
    template: mode.value === 'template' ? tpl.name : undefined,
    baseTemplate: tpl.name, kind: tpl.kind,
    layout: mode.value === 'template' ? layout.value : undefined, bgm: bgm.value,
    thumb: mode.value === 'image' ? thumb : undefined,
    productId: withProduct ? prod.id : undefined,
    productOverride: withProduct ? { spec: specOverride.value.trim(), price: priceOverride.value.trim(), origin: originOverride.value.trim() } : undefined,
    script: script || undefined,
    model: cfg?.model || undefined,
    prompt: prompt.value, ratio: ratio.value, duration: duration.value, style: style.value,
    status: '已完成'
  })
  generating.value = false
  toast('视频生成完成，已保存到我的视频作品')
  playing.value = rec
}

// —— 作品 ——
const playing = ref(null)
const recent = computed(() => store.videos.slice(0, 4))
function removeVideo(v) { if (window.confirm(`确定删除「${v.title}」吗？`)) { store.removeVideo(v.id); toast('作品已删除') } }

const heading = computed(() => ({ template: '模板参数设置', text: '描述你想生成的视频', image: '上传图片生成视频' }[mode.value]))
</script>

<template>
  <div class="video-creator">
    <div class="mode-tabs">
      <button :class="{ active: mode === 'template' }" @click="mode = 'template'"><Clapperboard :size="17"/>模板创作</button>
      <button :class="{ active: mode === 'text' }" @click="mode = 'text'"><Type :size="17"/>文生视频</button>
      <button :class="{ active: mode === 'image' }" @click="mode = 'image'"><ImagePlus :size="17"/>图生视频</button>
    </div>

    <!-- 模板 + 样片预览 -->
    <transition name="fade-slide" mode="out-in">
      <div v-if="mode === 'template'" key="tpl" class="tpl-layout">
        <div class="tpl-main"><div class="tpl-scroll">
          <div v-if="filterKinds" class="chip-group tpl-filter">
            <button v-for="k in ['全部', '助农', '文旅']" :key="k" class="choice-chip" :class="{ chosen: kindFilter === k }" @click="kindFilter = k">{{ k }}</button>
          </div>
          <TransitionGroup name="list" tag="div" class="template-grid">
            <div v-for="t in visibleTemplates" :key="t.name" class="template-card" :class="{ picked: selected.name === t.name }" role="button" tabindex="0" @click="choose(t)" @keydown.enter="choose(t)">
              <div class="template-cover dy-cover" :class="`dy-${t.layout}`" :style="{ background: `linear-gradient(160deg, ${t.palette[0]}, ${t.palette[1]})` }">
                <img class="cover-img" :src="tplCover(t)" :alt="t.name" loading="lazy" draggable="false"><small>{{ t.kind }}</small>
                <div class="cover-hl"><i v-for="(l, i) in t.headline.split('\n')" :key="i">{{ l }}</i></div>
                <em class="tpl-plays"><Play :size="10" fill="#fff" stroke="none"/>{{ statsOf(t.name).plays }}</em>
                <em class="tpl-ratio">{{ t.ratio }} · {{ t.duration.replace(' ', '') }}</em>
              </div>
              <div class="template-info"><b>{{ t.name }}</b><small>{{ t.desc }}</small></div>
              <button class="tpl-fav" :class="{ on: store.isFav('template', t.name) }" :title="store.isFav('template', t.name) ? '取消收藏' : '收藏模板'" @click.stop="toggleTplFav(t)"><Heart :size="14" :fill="store.isFav('template', t.name) ? 'currentColor' : 'none'"/></button>
              <span v-if="selected.name === t.name" class="selected-dot">✓</span>
            </div>
          </TransitionGroup>
        </div></div>

        <aside class="sample-panel">
          <div class="sample-head">
            <div><span class="kicker">SAMPLE PREVIEW</span><h3>样片效果预览</h3></div>
            <span class="pill">{{ selected.kind }}模板</span>
          </div>
          <div class="sample-stage">
            <MockPlayer ref="player" :scenes="selected.scenes" :palette="selected.palette" :ratio="ratio" :meta="previewMeta" :grade="style" :scene-ms="previewMs" badge="样片" :max-height="380" @scene="curScene = $event"/>
          </div>
          <div class="storyboard">
            <button v-for="(s, i) in selected.scenes" :key="s.img" :class="{ active: curScene === i }" @click="player?.seek(i)">
              <img class="sb-thumb" :src="photo(s.img, true)" alt="" loading="lazy">
              <span class="sb-copy"><small>镜头 {{ i + 1 }}</small><b>{{ plain(s.caption) }}</b></span>
            </button>
          </div>
          <div class="sample-tags">
            <div v-for="c in chips" :key="c.key" class="chip-wrap">
              <button class="tag-chip" :class="{ dark: c.dark, open: openChip === c.key }" :title="`点击修改${c.name}`" @click.stop="toggleChip(c, $event)">
                <component v-if="c.icon" :is="c.icon" :size="12"/>{{ c.label }}<ChevronDown :size="12" class="chev"/>
              </button>
              <transition name="menu">
                <div v-if="openChip === c.key" class="chip-menu" :class="{ grid: c.grid, right: menuRight }" @click.stop>
                  <small>{{ c.name }}</small>
                  <button v-for="o in c.options" :key="o.v" :class="{ on: o.v === c.value }" @click="pickChip(c, o.v)">{{ o.l }}<Check v-if="o.v === c.value" :size="12"/></button>
                </div>
              </transition>
            </div>
          </div>
          <p class="sample-note">点击上方标签可直接修改版式、配乐、画幅、时长和风格。样片仅为效果示意，实拍素材来自 Wikimedia Commons 开放授权图片。<button class="text-btn src-btn" @click="showCredits = !showCredits">{{ showCredits ? '收起来源' : '查看来源' }}</button></p>
          <transition name="fade-slide">
            <ul v-if="showCredits" class="credit-list">
              <li v-for="(s, i) in selected.scenes" :key="s.img"><span>镜头{{ i + 1 }}</span><a :href="credits[s.img]?.source" target="_blank" rel="noopener">{{ credits[s.img]?.author }}</a><em>{{ credits[s.img]?.license }}</em></li>
            </ul>
          </transition>
        </aside>
      </div>
    </transition>

    <!-- 参数面板 -->
    <div class="panel creator-panel">
      <div class="panel-heading">
        <div><h2>{{ heading }}</h2><p>{{ api ? (copyMode === 'api' ? '文案由你接入的模型生成，画面为本地合成演示' : '文案与画面均由本地模板生成，不调用模型') : '本页面仅模拟视频生成流程' }}</p></div>
        <WandSparkles :size="22" :class="`accent-${accent}`"/>
      </div>

      <transition name="fade-slide">
        <div v-if="mode === 'image'" class="upload-box" :class="{ 'has-file': preview }">
          <!-- 已上传时不再渲染文件输入框，避免它的透明热区盖住右上角的删除按钮 -->
          <input v-if="!preview" type="file" accept="image/*" @change="upload">
          <div v-if="preview" class="uploaded-preview" :style="{ '--preview': `url(${preview})` }">
            <img :src="preview" alt="已上传图片">
            <button type="button" class="remove-file" title="删除已上传的图片" aria-label="删除已上传的图片" @click.stop.prevent="clearFile"><Trash2 :size="15"/></button>
          </div>
          <div v-else class="upload-placeholder"><ImagePlus :size="30"/><b>点击上传图片</b><small>支持 JPG、PNG 等常见图片格式</small></div>
        </div>
      </transition>

      <!-- 识图结果：品类决定文案、价格和实拍素材，可手动纠正 -->
      <div v-if="mode === 'image' && preview && isAgri" class="detect-row">
        <Sparkles :size="15" class="detect-spark"/>
        <span class="detect-label">AI 识别</span>
        <b class="detect-name">{{ detecting ? '识别中…' : `${product?.emoji || ''} ${product?.name || ''}` }}</b>
        <select v-model="productId" :disabled="detecting" aria-label="识别到的农产品，可修改">
          <option v-for="p in products" :key="p.id" :value="p.id">{{ p.emoji }} {{ p.name }}</option>
        </select>
      </div>

      <!-- 产地 / 规格 / 价格：跟随识别结果预填，可自行修改，生成时同步到成片 -->
      <div v-if="mode === 'image' && preview && isAgri && product" class="product-fields">
        <label>产地<input v-model="originOverride" placeholder="例如：陕西 · 洛川"></label>
        <label>规格<input v-model="specOverride" placeholder="例如：5斤装"></label>
        <label>价格<span class="price-wrap">¥<input v-model="priceOverride" placeholder="例如：29.9"></span></label>
      </div>

      <label class="field-label">
        {{ mode === 'image' ? '画面动态描述' : '视频创意描述' }}
        <textarea v-model="prompt" :rows="mode === 'image' ? 3 : 4" :placeholder="mode === 'image' ? '希望图片中的哪些元素动起来？' : '描述画面、主体、镜头和氛围…'"></textarea>
      </label>
      <div v-if="mode === 'text'" class="example-row">
        <span><Lightbulb :size="13"/>试试示例：</span>
        <button v-for="e in examples" :key="e" class="choice-chip" @click="prompt = e">{{ e.slice(0, 14) }}…</button>
      </div>

      <div class="form-grid three">
        <label>视频比例<select v-model="ratio"><option>9:16</option><option>16:9</option><option>1:1</option></select></label>
        <label>视频时长<select v-model="duration"><option>5 秒</option><option>10 秒</option><option>15 秒</option><option>30 秒</option></select></label>
        <label>视频风格<select v-model="style"><option>清新自然</option><option>电影质感</option><option>活力宣传</option><option>纪实风格</option><option>国风人文</option></select></label>
      </div>

      <!-- 模板创作：选择农产品 + 产地/规格/价格，生成时替换模板里的对应内容 -->
      <div v-if="mode === 'template' && isAgri" class="product-fields">
        <label>农产品种类
          <select v-model="productId">
            <option value="">不指定（用模板默认文案）</option>
            <option v-for="p in products" :key="p.id" :value="p.id">{{ p.emoji }} {{ p.name }}</option>
          </select>
        </label>
        <template v-if="product">
          <label>产地<input v-model="originOverride" placeholder="例如：陕西 · 洛川"></label>
          <label>规格<input v-model="specOverride" placeholder="例如：5斤装"></label>
          <label>价格<span class="price-wrap">¥<input v-model="priceOverride" placeholder="例如：29.9"></span></label>
        </template>
      </div>

      <!-- API 接入状态：没接 API 时明确告知体验不完整 -->
      <div class="api-state" :class="{ ready: api }">
        <component :is="api ? PlugZap : Info" :size="15"/>
        <span v-if="api">已接入 <b>{{ api.provider }} · {{ api.model }}</b>，{{ copyMode === 'api' ? '文案会调用该模型生成。' : '文案当前使用本地模板，不调用模型。' }}</span>
        <span v-else>未接入自定义 API：当前成片为本地模板模拟，不会调用大模型，<b>体验不完整</b>。</span>
        <button class="text-btn" @click="router.push('/models')">{{ api ? '管理 API' : '去接入 API' }}</button>
      </div>

      <!-- 文案方式：本地文案 / 调用 API 模型（未接入模型时不可选） -->
      <div class="render-mode">
        <span class="render-label">文案方式</span>
        <button class="render-chip" :class="{ on: copyMode === 'local' }" @click="setCopyMode('local')">本地文案 · 不调用模型</button>
        <button class="render-chip" :class="{ on: copyMode === 'api' }" :disabled="!api" :title="api ? '调用已接入的模型写分镜文案' : '未接入 API 模型，暂不可选'" @click="setCopyMode('api')">API 模型生成</button>
        <small class="render-hint" :class="{ ok: copyMode === 'api' && !!api }">
          {{ !api ? '未接入 API 模型，只能使用本地文案' : (copyMode === 'api' ? `将调用 ${api.model} 写文案，耗时略长` : '不调用模型，文案由本地模板生成') }}
        </small>
      </div>

      <!-- 成片方式：本地合成 / 调用 API 真实生成 -->
      <div v-if="api" class="render-mode">
        <span class="render-label">成片方式</span>
        <button class="render-chip" :class="{ on: videoMode === 'local' }" @click="videoMode = 'local'">本地合成 · 几秒</button>
        <button class="render-chip" :class="{ on: videoMode === 'api' }" :disabled="!cap.supported" :title="cap.supported ? '调用 API 生成真实视频，通常 1–5 分钟' : cap.label" @click="videoMode = 'api'">API 真实生成 · 1–5 分钟</button>
        <small class="render-hint" :class="{ ok: cap.supported }">
          {{ cap.supported ? `${cap.label}：真实生成较慢，请耐心等待` : `${cap.label}（可继续用本地合成）` }}
        </small>
      </div>

      <button class="btn btn-primary wide gen-btn" :disabled="generating" @click="generate">
        <span v-if="generating" class="gen-fill" :style="{ width: progress + '%' }"></span>
        <LoaderCircle v-if="generating" class="spin" :size="18"/><WandSparkles v-else :size="18"/>
        <span class="gen-label">{{ generating ? `${stepText}… ${progress}%` : videoMode === 'api' ? '生成真实视频（较慢）' : '开始生成视频' }}</span>
      </button>
      <p class="disclaimer">{{ videoMode === 'api' ? '将调用你接入的视频模型真实生成，通常需要 1–5 分钟；按服务商计费。' : (api && copyMode === 'api' ? '文案会调用你配置的 API；成片画面仍由本地素材合成，不会产生视频模型费用。' : '文案由本地模板生成，不会调用任何模型，也不会产生费用。') }}</p>
    </div>

    <!-- 最近作品 -->
    <div class="section-title">
      <div><h2>我的视频作品</h2><p>点击作品即可播放预览</p></div>
      <button class="text-btn" @click="router.push('/profile/videos')">管理全部 {{ store.videos.length }} 个作品 <ChevronRight :size="15"/></button>
    </div>
    <TransitionGroup v-if="recent.length" name="list" tag="div" class="video-list">
      <div v-for="v in recent" :key="v.id" class="video-row clickable" @click="playing = v">
        <VideoCover :video="v"/>
        <div class="video-meta"><b>{{ v.title }}</b><small>{{ v.type }} · {{ videoView(v).ratio }} · {{ v.date }}</small></div>
        <span class="status"><CheckCircle2 :size="14"/> {{ v.status }}</span>
        <button class="icon-btn" title="删除" @click.stop="removeVideo(v)"><Trash2 :size="16"/></button>
      </div>
    </TransitionGroup>
    <div v-else class="empty-state">还没有作品，开始制作你的第一条视频吧。</div>

    <VideoPlayerModal :video="playing" @close="playing = null"/>
    <VideoProgress :open="videoTask.open" :elapsed="videoTask.elapsed" :message="videoTask.message" :provider="cap.label" :error="videoTask.error" @cancel="cancelVideoTask" @close="videoTask.open = false"/>
  </div>
</template>

<style scoped>
/* 删除按钮固定盖在已上传图片之上，保证始终可以点中 */
.uploaded-preview .remove-file {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 5;
  pointer-events: auto;
}

/* 识图结果条 */
.detect-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: -4px 0 16px;
  padding: 10px 13px;
  border-radius: 12px;
  background: #f1f8f1;
  border: 1px solid #dbebdb;
  font-size: 11px;
  color: #5d7163;
}
.detect-spark { color: #3f8455; flex: none; }
.detect-label { color: #7d9084; }
.detect-name { font-size: 12px; color: #24402c; }
.detect-row select {
  padding: 5px 9px;
  border-radius: 8px;
  border: 1px solid #d3e3d5;
  background: #fff;
  font-size: 11px;
  color: #33513d;
}
.detect-row small { color: #8b9a91; }

/* API 接入状态条 */
.api-state {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  margin: 4px 0 12px;
  padding: 9px 12px;
  border-radius: 11px;
  background: #fdf6ec;
  border: 1px solid #f3e2c8;
  color: #8a6a3a;
  font-size: 11px;
}
.api-state.ready { background: #f1f8f1; border-color: #dbebdb; color: #4c6a55; }
.api-state b { font-weight: 700; }
.api-state .text-btn { margin-left: auto; color: inherit; }

/* 成片方式切换 */
.render-mode {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 11px;
  color: #5d7163;
}
.render-label { color: #7d9084; }
.render-chip {
  border: 1px solid #d8e4da;
  background: #fff;
  color: #4d6155;
  border-radius: 20px;
  padding: 7px 12px;
  font-size: 11px;
}
.render-chip.on { background: #eaf3eb; border-color: #a7c8ad; color: #2f6b45; font-weight: 600; }
.render-chip:disabled { opacity: .5; cursor: not-allowed; }
.render-hint { width: 100%; color: #93a096; font-size: 10px; }
.render-hint.ok { color: #6f8a76; }

/* 产地 / 规格 / 价格 */
.product-fields { display: flex; flex-wrap: wrap; gap: 10px; margin: -8px 0 16px; }
.product-fields label { display: flex; flex-direction: column; gap: 5px; font-size: 10px; color: #7d9084; flex: 1; min-width: 130px; }
.product-fields input { border: 1px solid #dbe7dd; border-radius: 9px; padding: 8px 10px; font-size: 12px; color: #33513d; background: #fff; }
.product-fields select { border: 1px solid #dbe7dd; border-radius: 9px; padding: 8px 10px; font-size: 12px; color: #33513d; background: #fff; }
.product-fields input:focus { outline: none; border-color: #a7c8ad; box-shadow: 0 0 0 3px #e8f2e9; }
.price-wrap { display: flex; align-items: center; gap: 4px; border: 1px solid #dbe7dd; border-radius: 9px; padding: 0 10px; background: #fff; color: #8b9a91; font-size: 12px; }
.price-wrap input { border: 0; padding: 8px 0; flex: 1; }
.price-wrap input:focus { box-shadow: none; }
</style>
