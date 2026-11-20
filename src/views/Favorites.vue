<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Heart, HeartOff, ListChecks, Check, FileText, Clapperboard, LayoutTemplate, ChevronRight, Sparkles } from 'lucide-vue-next'
import SubPageHeader from '../components/SubPageHeader.vue'
import ReportModal from '../components/ReportModal.vue'
import VideoPlayerModal from '../components/VideoPlayerModal.vue'
import VideoCover from '../components/VideoCover.vue'
import BatchBar from '../components/BatchBar.vue'
import { useSelection } from '../composables/useSelection'
import { findTemplate, templates, tplCover } from '../data/templates'
import { useAppStore } from '../stores/app'
import { toast } from '../utils/toast'

const store = useAppStore(), router = useRouter()
const tabs = [
  { key: 'all', label: '全部' },
  { key: 'report', label: '分析报告' },
  { key: 'video', label: '视频作品' },
  { key: 'template', label: '视频模板' }
]
const tab = ref('all')
const countOf = k => k === 'all' ? store.favorites.length : store.favorites.filter(f => f.kind === k).length
const kindMeta = { report: { label: '分析报告', icon: FileText }, video: { label: '视频作品', icon: Clapperboard }, template: { label: '视频模板', icon: LayoutTemplate } }

// 关联原始内容（报告 / 视频 / 模板），原内容被删除时标记为失效
const items = computed(() => store.favorites
  .filter(f => tab.value === 'all' || f.kind === tab.value)
  .map(f => {
    const target = f.kind === 'report' ? store.reports.find(r => r.id === f.refId)
      : f.kind === 'video' ? store.videos.find(v => v.id === f.refId)
      : findTemplate(f.refId)
    return { ...f, target }
  }))
const sel = useSelection(items, f => f.key)
const reading = ref(null), playing = ref(null)

function open(f) {
  if (sel.managing.value) return sel.toggle(f)
  if (!f.target) return toast('原内容已被删除，可取消该收藏', 'info')
  if (f.kind === 'report') reading.value = f.target
  else if (f.kind === 'video') playing.value = f.target
  else router.push({ path: '/video', query: { template: f.refId } })
}
function unfav(f) { store.removeFavs([f.key]); toast('已取消收藏') }
function batchUnfav() {
  const n = sel.count.value
  store.removeFavs(sel.selectedItems.value.map(f => f.key)); sel.clear(); toast(`已取消 ${n} 项收藏`)
  if (!store.favorites.length) sel.stop()
}
// 空状态时推荐几个模板，一键收藏
const suggestions = computed(() => templates.filter(t => !store.isFav('template', t.name)).slice(0, 4))
function quickFav(t) { store.addFav({ kind: 'template', refId: t.name, title: t.name, sub: `${t.kind}模板 · ${t.desc}` }); toast(`已收藏模板「${t.name}」`) }
</script>
<template>
  <div>
    <SubPageHeader kicker="FAVORITES" title="我的收藏" :desc="`共 ${store.favorites.length} 项收藏，报告、作品与模板一处管理`">
      <button class="btn btn-sm" :class="sel.managing.value ? 'btn-primary' : 'btn-secondary'" :disabled="!store.favorites.length" @click="sel.managing.value ? sel.stop() : sel.start()">
        <ListChecks :size="15"/>{{ sel.managing.value ? '退出管理' : '批量管理' }}
      </button>
    </SubPageHeader>

    <div class="mode-tabs fav-tabs">
      <button v-for="t in tabs" :key="t.key" :class="{ active: tab === t.key }" @click="tab = t.key">{{ t.label }}<em>{{ countOf(t.key) }}</em></button>
    </div>

    <TransitionGroup v-if="items.length" name="list" tag="div" class="fav-grid">
      <div v-for="f in items" :key="f.key" class="fav-card" :class="{ checked: sel.isSel(f), invalid: !f.target }" @click="open(f)">
        <span v-if="sel.managing.value" class="checkbox" :class="{ on: sel.isSel(f) }"><Check v-if="sel.isSel(f)" :size="12"/></span>
        <VideoCover v-if="f.kind === 'video' && f.target" :video="f.target"/>
        <img v-else-if="f.kind === 'template' && f.target" class="fav-thumb photo" :src="tplCover(f.target)" alt="" loading="lazy">
        <div v-else class="fav-thumb" :class="f.kind"><component :is="kindMeta[f.kind]?.icon || Heart" :size="20"/></div>
        <div class="fav-body">
          <span class="fav-kind">{{ kindMeta[f.kind]?.label }}</span>
          <b>{{ f.title }}</b>
          <small>{{ f.target ? f.sub : '原内容已删除' }} · 收藏于 {{ f.date }}</small>
        </div>
        <button v-if="!sel.managing.value" class="icon-btn fav-remove" title="取消收藏" @click.stop="unfav(f)"><HeartOff :size="15"/></button>
        <span v-if="!sel.managing.value && f.target" class="fav-go">{{ f.kind === 'template' ? '使用' : '查看' }}<ChevronRight :size="13"/></span>
      </div>
    </TransitionGroup>
    <div v-else class="empty-state big">
      <Heart :size="34"/>
      <b>{{ tab === 'all' ? '还没有收藏' : `还没有收藏${tabs.find(t => t.key === tab).label}` }}</b>
      <small>在报告、作品详情或模板卡片上点击 ♡ 即可收藏</small>
    </div>

    <div v-if="!sel.managing.value && suggestions.length && (tab === 'all' || tab === 'template')" class="fav-suggest">
      <div class="section-title"><div><h2><Sparkles :size="17"/> 推荐模板</h2><p>一键收藏，下次直接使用</p></div></div>
      <div class="suggest-row">
        <button v-for="t in suggestions" :key="t.name" class="suggest-card" @click="quickFav(t)">
          <img class="fav-thumb photo" :src="tplCover(t)" alt="" loading="lazy">
          <span class="suggest-copy"><b>{{ t.name }}</b><small>{{ t.kind }} · {{ t.desc }}</small></span>
          <Heart :size="15"/>
        </button>
      </div>
    </div>

    <BatchBar :show="sel.managing.value" :count="sel.count.value" :all-selected="sel.allSelected.value" @toggle-all="sel.toggleAll()" @done="sel.stop()">
      <button class="btn btn-danger btn-sm" :disabled="!sel.count.value" @click="batchUnfav"><HeartOff :size="14"/>取消收藏</button>
    </BatchBar>
    <ReportModal :report="reading" @close="reading = null"/>
    <VideoPlayerModal :video="playing" @close="playing = null"/>
  </div>
</template>
