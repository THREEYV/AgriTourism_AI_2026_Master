<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Sprout, Trees, Beef, Fish, Package, ShoppingBag, Sparkles, LoaderCircle, Copy, Heart, Clapperboard, FileText } from 'lucide-vue-next'
import { agricultureReport, reportToText } from '../utils/mockAI'
import { generateReport } from '../utils/llm'
import { agriTemplates } from '../data/templates'
import { useAppStore } from '../stores/app'
import { toast } from '../utils/toast'
import VideoCreator from '../components/VideoCreator.vue'
const store = useAppStore(), router = useRouter()
const activeTab = ref('analysis') // 'analysis' | 'video'

// 页头随二级导航切换，只保留一个页头和一个图标
const head = computed(() => activeTab.value === 'analysis'
  ? { kicker: 'SMART AGRICULTURE', title: 'AI 助农', desc: '让 AI 成为你的农业产业发展顾问。', icon: Sprout }
  : { kicker: 'AGRI VIDEO', title: '助农宣传视频制作', desc: '为农产品和农业企业打造专业宣传视频。', icon: Clapperboard })

// 农业领域选择
const industries = [
  { name: '种植业', desc: '粮食、水果、蔬菜、特色作物', icon: Sprout },
  { name: '林业', desc: '苗木培育、林下经济、生态产业', icon: Trees },
  { name: '畜牧业', desc: '畜禽养殖、特色养殖、产品加工', icon: Beef },
  { name: '渔业', desc: '水产养殖、捕捞、加工与流通', icon: Fish },
  { name: '农产品加工', desc: '产品包装、深加工与品牌升级', icon: Package },
  { name: '农产品销售', desc: '电商、直播、渠道与市场拓展', icon: ShoppingBag }
]

// 行业分析表单
const form = ref({ province: '山东省', city: '青岛市', area: '', industry: '种植业', scale: '小规模经营', problem: '销售渠道比较单一，希望提升产品知名度。', goal: '打造区域特色品牌，拓展线上销售。' })
const loading = ref(false), report = ref(null), error = ref('')
async function analyze() {
  error.value = ''; loading.value = true; report.value = null
  const cfg = store.activeApi
  try {
    let r
    if (cfg) {
      try {
        r = await generateReport(cfg, { kind: 'agri', form: form.value })
        toast(`报告由 ${cfg.model} 生成，并已保存到「我的分析报告」`)
      } catch (e) {
        toast(`AI 生成失败：${e.message}，已改用本地模板报告`, 'info', 4500)
        r = await agricultureReport(form.value)
      }
    } else {
      r = await agricultureReport(form.value)
      toast('未接入自定义 API，本次为本地模板报告', 'info', 3200)
    }
    report.value = store.addReport({ ...r, type: '农业分析', date: new Date().toLocaleString(), model: cfg?.model })
  } catch (e) { error.value = '生成失败，请重试' } finally { loading.value = false }
}
async function copyReport() {
  try { await navigator.clipboard.writeText(reportToText(report.value)); toast('报告内容已复制') }
  catch { toast('浏览器不允许访问剪贴板', 'info') }
}
const faved = computed(() => report.value && store.isFav('report', report.value.id))
function favReport() {
  const on = store.toggleFav({ kind: 'report', refId: report.value.id, title: report.value.title, sub: '农业分析' })
  toast(on ? '已加入我的收藏' : '已取消收藏')
}
</script>
<template>
  <div>
    <div class="page-heading">
      <transition name="fade-slide" mode="out-in">
        <div :key="activeTab"><span class="kicker">{{ head.kicker }}</span><h1>{{ head.title }}</h1><p>{{ head.desc }}</p></div>
      </transition>
      <div class="heading-art green-art">
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
        <div class="callout green-callout">
          <div><b>从产业现状到品牌营销</b><p>选择领域，描述你的实际情况，获取可参考的发展思路。</p></div>
          <Sparkles :size="28"/>
        </div>
        <h2 class="block-title">选择农业领域</h2>
        <div class="industry-grid">
          <button v-for="it in industries" :key="it.name" class="industry-card" :class="{ selected: form.industry === it.name }" @click="form.industry = it.name">
            <component :is="it.icon" :size="25"/><b>{{ it.name }}</b><small>{{ it.desc }}</small>
          </button>
        </div>
        <div class="panel form-panel">
          <div class="panel-heading">
            <div><h2>农业产业发展分析</h2><p>填写基础信息，生成初步分析建议</p></div>
            <span class="pill">{{ store.activeApi ? '真实模型' : '本地演示' }}</span>
          </div>
          <div class="form-grid">
            <label>所在省份<input v-model="form.province" placeholder="例如：山东省"></label>
            <label>所在城市<input v-model="form.city" placeholder="例如：青岛市"></label>
            <label>具体地区<input v-model="form.area" placeholder="区县 / 乡镇 / 村庄"></label>
            <label>经营规模<select v-model="form.scale"><option>小规模经营</option><option>家庭农场</option><option>合作社</option><option>农业企业</option><option>规模化经营</option></select></label>
            <label class="full">当前遇到的问题<textarea v-model="form.problem" rows="3" placeholder="描述目前经营中遇到的困难"></textarea></label>
            <label class="full">未来发展目标<textarea v-model="form.goal" rows="3" placeholder="希望实现什么目标"></textarea></label>
          </div>
          <button class="btn btn-primary wide" :disabled="loading" @click="analyze"><LoaderCircle v-if="loading" class="spin" :size="18"/><Sparkles v-else :size="18"/>{{ loading ? 'AI 正在分析…' : '开始 AI 分析' }}</button>
          <p class="disclaimer">{{ store.activeApi ? `报告会真实调用 ${store.activeApi.model} 生成，通常需要 10–40 秒。` : '演示说明：当前报告由本地 Mock 数据生成；接入 API 后可用真实模型生成。' }}</p>
        </div>
        <div v-if="error" class="alert">{{ error }}</div>
        <transition name="fade-slide">
          <div v-if="report" class="panel report-panel">
            <div class="panel-heading">
              <div><span class="kicker">ANALYSIS REPORT</span><h2>{{ report.title }}</h2></div>
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
        <VideoCreator :templates="agriTemplates" accent="green"/>
      </div>
    </transition>
  </div>
</template>
