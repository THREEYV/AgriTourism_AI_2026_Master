<script setup>
// 抖音风格的模拟短视频播放器（实拍素材版）
// 画面：实拍照片 + 运镜（推拉摇移）+ 转场 + 按风格调色 + 胶片颗粒 + 氛围光效
// 界面：手机状态栏、推荐页顶栏、右侧互动栏、小黄车 / 定位、音乐跑马灯、底部导航栏
// 横屏 / 方形视频居中显示，上下用模糊画面铺底（与抖音竖屏剪辑一致）
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Play, Heart, MessageCircleMore, Star, Forward, Search, MapPin, Music, ShoppingCart, Plus } from 'lucide-vue-next'
import { captionParts, statsOf, photo } from '../data/templates'

const props = defineProps({
  scenes: { type: Array, default: () => [] },
  palette: { type: Array, default: () => ['#cfdccf', '#7f9a84'] },
  ratio: { type: String, default: '9:16' },
  meta: { type: Object, default: () => ({}) },
  grade: { type: String, default: '清新自然' },   // 视频风格 → 调色
  title: String,
  badge: String,
  image: String,                                   // 图生视频：所有镜头使用这张图
  autoplay: { type: Boolean, default: true },
  sceneMs: { type: Number, default: 3200 },
  maxHeight: { type: Number, default: 420 },
  chrome: { type: Boolean, default: true }          // false = 纯净成片（不含抖音界面元素）
})
const emit = defineEmits(['scene'])

const m = computed(() => ({ layout: 'vlog', tags: [], account: '@乡韵智创', bgm: '原创音乐', atmo: 'none', ...props.meta }))
const stats = computed(() => statsOf(m.value.name || props.title))
const headlineLines = computed(() => String(m.value.headline || props.title || '').split('\n'))
const caption = computed(() => props.title || String(m.value.headline || '').replace(/\n/g, ''))

// —— 播放控制 ——
const idx = ref(0), elapsed = ref(0), playing = ref(props.autoplay)
let timer = null
const count = computed(() => Math.max(props.scenes.length, 1))
const total = computed(() => count.value * props.sceneMs)
const scene = computed(() => props.scenes[idx.value] || { caption: '' })
const parts = computed(() => captionParts(scene.value.caption))
// 图生视频的分镜里带 still 标记的镜头，用上传的图片做“活照片”运镜
const stillScene = computed(() => !!(props.image && props.scenes[idx.value]?.still))
const prevStill = computed(() => idx.value > 0 && !!(props.image && props.scenes[idx.value - 1]?.still))
const src = s => (s?.still && props.image) ? props.image : photo(s?.img)
const thumb = s => (s?.still && props.image) ? props.image : photo(s?.img, true)
// 同一张上传图可能出现两次，用不同的运镜轨迹区分（推近 / 横移 / 缓拉）
const stillTone = computed(() => scene.value.tone || ['a', 'b', 'c'][idx.value % 3])

const FX = ['push', 'pan-r', 'pull', 'pan-l']
const CUTS = ['cut-zoom', 'cut-whip', 'cut-flash', 'cut-fade']
const GRADES = { 清新自然: 'fresh', 电影质感: 'film', 活力宣传: 'vivid', 纪实风格: 'docu', 国风人文: 'guofeng' }
const fx = computed(() => scene.value.fx || FX[idx.value % FX.length])
const cut = computed(() => {
  // 上传图进出都用叠化，实拍镜头之间才用甩镜 / 缩放 / 闪白
  if (idx.value === 0 || stillScene.value || prevStill.value) return 'cut-fade'
  return CUTS[(idx.value - 1) % CUTS.length]
})
const atmo = computed(() => scene.value.atmo || m.value.atmo || 'none')
const gradeKey = computed(() => scene.value.grade || GRADES[props.grade] || 'fresh')
const focal = computed(() => (scene.value.pos || '50% 50%').split(' '))
const progress = computed(() => (elapsed.value / total.value) * 100)

function tick() {
  if (!playing.value) return
  elapsed.value += 100
  if (elapsed.value >= total.value) elapsed.value = 0
  idx.value = Math.min(Math.floor(elapsed.value / props.sceneMs), count.value - 1)
}
function seek(i) { idx.value = i; elapsed.value = i * props.sceneMs; playing.value = true }
function seekAt(e) {
  const r = e.currentTarget.getBoundingClientRect()
  elapsed.value = Math.floor(Math.min(0.999, Math.max(0, (e.clientX - r.left) / r.width)) * total.value)
  idx.value = Math.min(Math.floor(elapsed.value / props.sceneMs), count.value - 1)
  playing.value = true
}
defineExpose({ seek })

// 预加载所有镜头，避免切换时闪白
function preload() { props.scenes.forEach(s => { const u = src(s); if (u) { const i = new Image(); i.src = u } }) }
onMounted(() => { timer = setInterval(tick, 100); preload() })
onBeforeUnmount(() => clearInterval(timer))
watch(() => props.scenes, () => { idx.value = 0; elapsed.value = 0; playing.value = props.autoplay; liked.value = false; preload() })
watch(() => props.sceneMs, () => { elapsed.value = idx.value * props.sceneMs })
watch(idx, v => emit('scene', v))

// —— 点赞：点击红心 / 双击画面 ——
const liked = ref(false), bursts = ref([])
let uid = 0
function onDbl(e) {
  const r = e.currentTarget.getBoundingClientRect()
  const id = ++uid
  bursts.value.push({ id, x: e.clientX - r.left, y: e.clientY - r.top, rot: Math.round(Math.random() * 40 - 20) })
  setTimeout(() => { bursts.value = bursts.value.filter(b => b.id !== id) }, 900)
  liked.value = true
}

// —— 画幅：屏幕区域 = 9:16 画框减去底部导航栏（11cqw）——
const SCREEN = 177.78 - 11
const frac = computed(() => {
  const [w, h] = props.ratio.split(':').map(Number)
  return Math.min(1, (h / w) * 100 / SCREEN)
})
const bandTop = computed(() => ((1 - frac.value) / 2) * 100)

const now = new Date()
const clock = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
const dateText = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
const chapter = ['一', '二', '三', '四', '五', '六']
const music = computed(() => `${m.value.bgm} - ${m.value.account.replace('@', '')}创作的原声`)

// 氛围粒子的固定参数（浮尘 / 火星 / 光斑 / 热气）
const motes = Array.from({ length: 12 }, (_, i) => ({ l: ((i * 37 + 11) % 90) + 5, d: -((i * 0.83) % 6).toFixed(2), t: (5.5 + (i % 4) * 1.4).toFixed(1), s: (0.55 + (i % 3) * 0.35).toFixed(2) }))
const orbs = Array.from({ length: 7 }, (_, i) => ({ l: ((i * 29 + 7) % 84) + 4, top: ((i * 41 + 13) % 70) + 8, sz: 9 + (i % 3) * 6, d: -(i * 1.3), c: ['255,190,110', '255,120,90', '255,232,170', '170,205,255'][i % 4] }))
</script>

<template>
  <div class="dy" :class="[`dy-${m.layout}`, { paused: !playing, landscape: frac < 1, wide: frac < 0.45, 'chrome-off': !chrome }]"
       :style="{ maxWidth: Math.round(maxHeight * 9 / 16) + 'px', '--c1': palette[0], '--c2': palette[1], '--band': frac, '--band-top': bandTop + '%', '--shot-ms': sceneMs + 'ms' }"
       @click="playing = !playing" @dblclick="onDbl">
    <div class="dy-screen">
      <!-- 横屏 / 方形视频的模糊铺底 -->
      <div v-if="frac < 1" class="dy-backdrop"><transition name="cut-fade"><img :key="idx" :src="thumb(scene)" alt=""></transition></div>

      <!-- 视频画面 -->
      <div class="dy-video">
        <transition :name="cut" type="transition">
          <!-- 图生视频：上传图所在镜头做“活照片”连续运镜，其余镜头用模板实拍素材 -->
          <div v-if="stillScene" :key="'still-' + idx" class="dy-still" :class="[`g-${gradeKey}`, `still-${stillTone}`]"
               :style="{ '--px': focal[0], '--py': focal[1] }">
            <img class="dy-still-img" :src="src(scene)" alt="" draggable="false">
            <i class="dy-still-glow"></i>
            <i class="dy-still-sheen"></i>
          </div>
          <div v-else :key="idx" class="dy-shot" :class="`g-${gradeKey}`">
            <img class="dy-photo" :class="`fx-${fx}`" :src="src(scene)" alt="" draggable="false" :style="{ '--px': focal[0], '--py': focal[1] }">
          </div>
        </transition>
        <transition name="fade">
          <div class="dy-atmo" :class="`atmo-${atmo}`" :key="atmo">
            <template v-if="atmo === 'dust' || atmo === 'embers'"><i v-for="(p, i) in motes" :key="i" class="mote" :style="{ left: p.l + '%', animationDelay: p.d + 's', animationDuration: p.t + 's', '--s': p.s }"></i></template>
            <template v-else-if="atmo === 'bokeh'"><i v-for="(o, i) in orbs" :key="i" class="orb" :style="{ left: o.l + '%', top: o.top + '%', width: o.sz + 'cqw', height: o.sz + 'cqw', animationDelay: o.d + 's', '--rgb': o.c }"></i></template>
            <template v-else-if="atmo === 'steam'"><i v-for="n in 3" :key="n" class="wisp" :style="{ left: (26 + n * 13) + '%', animationDelay: (-n * 1.4) + 's' }"></i></template>
          </div>
        </transition>
        <div v-if="m.layout === 'story'" class="dy-letterbox"></div>
        <div class="dy-grain"></div>
        <div class="dy-vignette"></div>
        <div v-if="cut === 'cut-flash'" :key="'flash' + idx" class="dy-flash"></div>
      </div>
      <div class="dy-shade"></div>

      <!-- 手机状态栏 + 推荐页顶栏 -->
      <div v-if="chrome" class="dy-status">
        <b>{{ clock }}</b>
        <span class="sb-icons">
          <svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx=".7"/><rect x="5" y="5.5" width="3" height="6.5" rx=".7"/><rect x="10" y="3" width="3" height="9" rx=".7"/><rect x="15" y="0" width="3" height="12" rx=".7"/></svg>
          <svg viewBox="0 0 16 12"><path d="M8 12l2.6-2.6a3.7 3.7 0 0 0-5.2 0z"/><path d="M3.2 7.2l1.5 1.5a4.7 4.7 0 0 1 6.6 0l1.5-1.5a6.8 6.8 0 0 0-9.6 0z"/><path d="M0 4l1.5 1.5a9.2 9.2 0 0 1 13 0L16 4A11.3 11.3 0 0 0 0 4z"/></svg>
          <svg viewBox="0 0 27 12"><rect x=".6" y=".6" width="22.8" height="10.8" rx="3.2" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/><rect x="2.4" y="2.4" width="16.5" height="7.2" rx="1.6"/><path d="M25 4.2v3.6a2 2 0 0 0 0-3.6z" fill-opacity=".5"/></svg>
        </span>
      </div>
      <div v-if="chrome" class="dy-top">
        <span v-if="badge" class="dy-badge">{{ badge }}</span>
        <nav><span>同城</span><span>关注</span><b>推荐</b></nav>
        <Search class="dy-search"/>
      </div>
      <div v-if="m.layout === 'vlog'" class="dy-date">{{ dateText }} · 晴 18℃</div>
      <transition name="sub" mode="out-in"><div v-if="m.layout === 'story'" :key="idx" class="dy-chapter">— 第{{ chapter[idx] }}幕 —</div></transition>

      <!-- 花字标题 -->
      <transition name="hl-pop" appear mode="out-in">
        <div class="dy-headline" :key="m.headline || title"><span v-for="(l, i) in headlineLines" :key="i" :style="{ animationDelay: i * 0.12 + 's' }">{{ l }}</span></div>
      </transition>

      <!-- 字幕 -->
      <transition name="sub" mode="out-in">
        <div class="dy-sub" :key="idx"><template v-for="(p, i) in parts" :key="i"><em v-if="p.hl">{{ p.t }}</em><template v-else>{{ p.t }}</template></template></div>
      </transition>

      <!-- 带货价格标签 -->
      <transition name="stamp">
        <div v-if="chrome && m.cart && idx >= 1" class="dy-price"><em>限时到手价</em><span>¥<b>{{ m.cart.price }}</b></span></div>
      </transition>

      <!-- 右侧互动栏 -->
      <div v-if="chrome" class="dy-rail" @click.stop @dblclick.stop>
        <div class="dy-avatar"><img :src="thumb(scenes[0])" alt=""><i><Plus/></i></div>
        <button class="dy-act" :class="{ on: liked }" @click="liked = !liked"><Heart :fill="liked ? '#fe2c55' : '#fff'" stroke="none"/><small>{{ stats.likes }}</small></button>
        <div class="dy-act"><MessageCircleMore fill="#fff" stroke="none"/><small>{{ stats.comments }}</small></div>
        <div class="dy-act"><Star fill="#fff" stroke="none"/><small>{{ stats.stars }}</small></div>
        <div class="dy-act"><Forward fill="#fff" stroke="none"/><small>{{ stats.shares }}</small></div>
        <div class="dy-disc"><img :src="thumb(scenes[1] || scenes[0])" alt=""></div>
      </div>

      <!-- 左下：小黄车 / 定位、账号、文案、音乐 -->
      <div v-if="chrome" class="dy-info">
        <!-- 带货视频补一个产地角标，更像真实的助农直播间/短视频 -->
        <div v-if="m.cart && m.loc" class="dy-origin"><MapPin/>产地直发 · {{ m.loc }}</div>
        <div v-if="m.cart" class="dy-cart"><span class="cart-ico"><ShoppingCart/></span><span class="cart-t">{{ m.cart.title }}</span><b>¥{{ m.cart.price }}</b></div>
        <div v-else-if="m.loc" class="dy-loc"><MapPin/>{{ m.loc }}</div>
        <b class="dy-account">{{ m.account }}</b>
        <p class="dy-caption">{{ caption }}<span v-for="t in m.tags" :key="t"> #{{ t }}</span></p>
        <div class="dy-music"><Music/><div class="dy-marquee"><span>{{ music }}　　　{{ music }}　　　</span></div></div>
      </div>

      <!-- 进度条（可点击跳转） -->
      <div v-if="chrome" class="dy-progress" @click.stop="seekAt" @dblclick.stop><i><b :style="{ width: progress + '%' }"></b></i></div>

      <transition name="fade"><div v-if="chrome && !playing" class="dy-paused"><Play fill="#fff" stroke="none"/></div></transition>
      <template v-if="chrome">
        <span v-for="b in bursts" :key="b.id" class="dy-burst" :style="{ left: b.x + 'px', top: b.y + 'px', '--r': b.rot + 'deg' }">❤</span>
      </template>
    </div>

    <!-- 底部导航栏 -->
    <nav v-if="chrome" class="dy-tabbar" @click.stop @dblclick.stop>
      <b>首页</b><span>朋友</span><i class="dy-plus"><Plus/></i><span>消息</span><span>我</span>
    </nav>
  </div>
</template>
