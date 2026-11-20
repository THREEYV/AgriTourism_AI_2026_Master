<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { MapPin, Mountain, Camera, Sparkles, LoaderCircle, Copy, Heart, Clapperboard, FileText } from 'lucide-vue-next'
import { tourismReport, reportToText } from '../utils/mockAI'
import { generateReport } from '../utils/llm'
import { tourismTemplates } from '../data/templates'
import { useAppStore } from '../stores/app'
import { toast } from '../utils/toast'
import VideoCreator from '../components/VideoCreator.vue'
const store = useAppStore(), router = useRouter()
const activeTab = ref('analysis') // 'analysis' | 'video'

const head = computed(() => activeTab.value === 'analysis'
  ? { kicker: 'CULTURE & TOURISM', title: 'AI 文旅', desc: '发现地方特色资源，探索农文旅融合发展新思路。', icon: Mountain }
  : { kicker: 'TOURISM VIDEO', title: '文旅宣传视频制作', desc: '为目的地和文旅项目打造精美宣传视频。', icon: Clapperboard })

// 行业分析表单
const form = ref({ province: '山东省', city: '青岛市', spot: '', focus: ['地域文化', '自然资源', '农旅融合'] })
const focuses = ['地域文化', '自然资源', '历史文化', '旅游资源', '农旅融合', '产业发展定位', '旅游品牌建设', '营销推广', '发展规划']
const loading = ref(false), report = ref(null)
function toggle(v) { form.value.focus = form.value.focus.includes(v) ? form.value.focus.filter(x => x !== v) : [...form.value.focus, v] }
async function analyze() {
  loading.value = true; report.value = null
  const cfg = store.activeApi
  try {
    let r
    if (cfg) {
      try {
        r = await generateReport(cfg, { kind: 'tourism', form: form.value })
        toast(`报告由 ${cfg.model} 生成，并已保存到「我的分析报告」`)
      } catch (e) {
        toast(`AI 生成失败：${e.message}，已改用本地模板报告`, 'info', 4500)
        r = await tourismReport(form.value)
      }
    } else {
      r = await tourismReport(form.value)
      toast('未接入自定义 API，本次为本地模板报告', 'info', 3200)
    }
    report.value = store.addReport({ ...r, type: '文旅分析', date: new Date().toLocaleString(), model: cfg?.model })
  } finally { loading.value = false }
}
async function copyReport() {
  try { await navigator.clipboard.writeText(reportToText(report.value)); toast('报告内容已复制') }
  catch { toast('浏览器不允许访问剪贴板', 'info') }
}
const faved = computed(() => report.value && store.isFav('report', report.value.id))
function favReport() {
  const on = store.toggleFav({ kind: 'report', refId: report.value.id, title: report.value.title, sub: '文旅分析' })
  toast(on ? '已加入我的收藏' : '已取消收藏')
}
</script>
<template>
  <div>
    <div class="page-heading">
      <transition name="fade-slide" mode="out-in">
        <div :key="activeTab"><span class="kicker">{{ head.kicker }}</span><h1>{{ head.title }}</h1><p>{{ head.desc }}</p></div>
      </transition>
      <div class="heading-art orange-art">
        <transition name="pop" mode="out-in"><component :is="head.icon" :key="activeTab" :size="46"/></transition>
      </div>
    </div>

    <!-- 二级导航 -->
    <div class="mode-tabs main-tabs">
      <button :class="{ active: activeTab === 'analysis' }" @click="activeTab = 'analysis'"><Sparkles :size="17"/>行业分析</button>
      <button :class="{ active: activeTab === 'video' }" @click="activeTab = 'video'"><Clapperboard :size="17"/>视频制作</button>
    </div>

    <transition name="fade-slide" mode="out-in">
      <!-- 行业分析 -->
      <div v-if="activeTab === 'analysis'" key="analysis">
        <div class="tourism-banner">
          <div><span class="kicker">DESTINATION INSIGHT</span><h2>让每一处风景<br>都有自己的故事</h2><p>从地域文化、自然资源到产业融合，辅助梳理目的地发展方向。</p></div>
          <div class="banner-stamp"><Camera :size="34"/><small>LOCAL<br>STORY</small></div>
        </div>
        <div class="panel form-panel">
          <div class="panel-heading">
            <div><h2>选择目的地</h2><p>先定位地区，再开展文旅分析</p></div>
            <div class="heading-right">
              <span class="pill" :class="{ on: store.activeApi }">{{ store.activeApi ? '真实模型' : '本地演示' }}</span>
              <MapPin :size="22" class="accent-orange"/>
            </div>
          </div>
          <div class="form-grid">
            <label>省份<input v-model="form.province" placeholder="请选择省份"></label>
            <label>城市 / 县区<input v-model="form.city" placeholder="请选择城市或县区"></label>
            <label class="full">具体地点<input v-model="form.spot" placeholder="例如：某某古镇、景区、乡村或特色街区"></label>
          </div>
          <h3 class="small-heading">选择 AI 分析方向</h3>
          <div class="chip-group">
            <button v-for="f in focuses" :key="f" class="choice-chip" :class="{ chosen: form.focus.includes(f) }" @click="toggle(f)">{{ f }}</button>
          </div>
          <button class="btn btn-primary wide" :disabled="loading" @click="analyze"><LoaderCircle v-if="loading" class="spin" :size="18"/><Sparkles v-else :size="18"/>{{ loading ? '正在分析目的地…' : '生成文旅发展建议' }}</button>
          <p class="disclaimer">{{ store.activeApi ? `报告会真实调用 ${store.activeApi.model} 生成，通常需要 10–40 秒。` : '演示说明：本原型不连接地图或实时文旅数据，报告内容为模拟示例；接入 API 后可用真实模型生成。' }}</p>
        </div>
        <transition name="fade-slide">
          <div v-if="report" class="panel report-panel">
            <div class="panel-heading">
              <div><span class="kicker">TOURISM REPORT</span><h2>{{ report.title }}</h2></div>
              <span class="status">已保存</span>
            </div>
            <p class="report-summary">{{ report.summary }}</p>
            <div v-for="(s, i) in report.sections" :key="s[0]" class="report-section">
              <h3><span>{{ String(i + 1).padStart(2, '0') }}</span>{{ s[0] }}</h3><p>{{ s[1] }}</p>
            </div>
            <div class="report-actions">
              <button class="btn btn-secondary" @click="copyReport"><Copy :size="16"/>复制报告</button>
              <button class="btn btn-secondary" :class="{ faved }" @click="favReport"><Heart :size="16" :fill="faved ? 'currentColor' : 'none'"/>{{ faved ? '已收藏' : '收藏报告' }}</button>
              <button class="btn btn-primary" @click="router.push('/profile/reports')"><FileText :size="16"/>查看我的报告</button>
            </div>
          </div>
        </transition>
      </div>

      <!-- 视频制作 -->
      <div v-else key="video">
        <VideoCreator :templates="tourismTemplates" accent="orange"/>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.heading-right{display:flex;align-items:center;gap:10px}
.pill.on{background:#e8f2e9;color:#2f6b45;border:1px solid #bfdcc4}
</style>
