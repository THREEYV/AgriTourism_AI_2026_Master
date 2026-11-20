<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ListChecks, Heart, Download, Trash2, Check, FileText, Sprout, Compass, ChevronRight } from 'lucide-vue-next'
import SubPageHeader from '../components/SubPageHeader.vue'
import ReportModal from '../components/ReportModal.vue'
import BatchBar from '../components/BatchBar.vue'
import { useSelection } from '../composables/useSelection'
import { useAppStore } from '../stores/app'
import { toast } from '../utils/toast'
import { reportToText, downloadText } from '../utils/mockAI'

const store = useAppStore(), router = useRouter()
const keyword = ref(''), type = ref('全部')
const types = ['全部', '农业分析', '文旅分析']
const countOf = t => t === '全部' ? store.reports.length : store.reports.filter(r => r.type === t).length
const list = computed(() => {
  const k = keyword.value.trim()
  return store.reports.filter(r => (type.value === '全部' || r.type === type.value) && (!k || r.title.includes(k) || r.summary.includes(k)))
})
const sel = useSelection(list)
const reading = ref(null)

function open(r) { sel.managing.value ? sel.toggle(r) : (reading.value = r) }
function batchFav() {
  sel.selectedItems.value.forEach(r => store.addFav({ kind: 'report', refId: r.id, title: r.title, sub: r.type }))
  toast(`已收藏 ${sel.count.value} 份报告`)
}
function batchExport() {
  const text = sel.selectedItems.value.map(reportToText).join('\n\n————————————————\n\n')
  downloadText(`分析报告合集_${sel.count.value}份.txt`, text)
  toast(`已导出 ${sel.count.value} 份报告`)
}
function batchDelete() {
  const n = sel.count.value
  if (!window.confirm(`确定删除选中的 ${n} 份报告吗？此操作不可恢复。`)) return
  store.removeReports(sel.selectedItems.value.map(r => r.id)); sel.clear(); toast(`已删除 ${n} 份报告`)
  if (!store.reports.length) sel.stop()
}
</script>
<template>
  <div>
    <SubPageHeader kicker="MY REPORTS" title="我的分析报告" :desc="`共 ${store.reports.length} 份报告，生成后自动保存在这里`"/>

    <div class="report-stats">
      <button class="rs-card agri" @click="router.push('/agriculture')"><Sprout :size="20"/><div><b>{{ countOf('农业分析') }}</b><small>农业分析</small></div><span>新建 <ChevronRight :size="13"/></span></button>
      <button class="rs-card tourism" @click="router.push('/tourism')"><Compass :size="20"/><div><b>{{ countOf('文旅分析') }}</b><small>文旅分析</small></div><span>新建 <ChevronRight :size="13"/></span></button>
    </div>

    <div class="toolbar">
      <label class="search-box"><Search :size="15"/><input v-model="keyword" placeholder="搜索报告标题或摘要"></label>
      <button class="btn btn-sm" :class="sel.managing.value ? 'btn-primary' : 'btn-secondary'" @click="sel.managing.value ? sel.stop() : sel.start()" :disabled="!store.reports.length">
        <ListChecks :size="15"/>{{ sel.managing.value ? '退出管理' : '批量管理' }}
      </button>
    </div>
    <div class="chip-group filter-row">
      <button v-for="t in types" :key="t" class="choice-chip" :class="{ chosen: type === t }" @click="type = t">{{ t }} <em>{{ countOf(t) }}</em></button>
    </div>

    <TransitionGroup v-if="list.length" name="list" tag="div" class="report-list">
      <div v-for="r in list" :key="r.id" class="report-card" :class="{ checked: sel.isSel(r) }" @click="open(r)">
        <span v-if="sel.managing.value" class="checkbox" :class="{ on: sel.isSel(r) }"><Check v-if="sel.isSel(r)" :size="12"/></span>
        <div class="rc-icon" :class="r.type === '文旅分析' ? 'tourism' : 'agri'"><component :is="r.type === '文旅分析' ? Compass : Sprout" :size="20"/></div>
        <div class="rc-body">
          <div class="rc-top"><span class="type-badge" :class="r.type === '文旅分析' ? 'tourism' : 'agri'">{{ r.type || '分析报告' }}</span><small>{{ r.date }}</small><Heart v-if="store.isFav('report', r.id)" :size="13" fill="currentColor" class="fav-inline"/></div>
          <b>{{ r.title }}</b>
          <p>{{ r.summary }}</p>
          <small class="rc-sections">{{ r.sections.length }} 个章节 · {{ r.sections.map(s => s[0]).slice(0, 3).join(' / ') }}…</small>
        </div>
        <ChevronRight v-if="!sel.managing.value" :size="18" class="muted"/>
      </div>
    </TransitionGroup>
    <div v-else class="empty-state big">
      <FileText :size="34"/>
      <b>{{ store.reports.length ? '没有符合条件的报告' : '还没有分析报告' }}</b>
      <small>{{ store.reports.length ? '换个关键词或分类试试' : '在 AI 助农或 AI 文旅中生成第一份报告' }}</small>
      <div v-if="!store.reports.length" class="empty-actions"><button class="btn btn-primary btn-sm" @click="router.push('/agriculture')">农业分析</button><button class="btn btn-secondary btn-sm" @click="router.push('/tourism')">文旅分析</button></div>
    </div>

    <BatchBar :show="sel.managing.value" :count="sel.count.value" :all-selected="sel.allSelected.value" @toggle-all="sel.toggleAll()" @done="sel.stop()">
      <button class="btn btn-secondary btn-sm" :disabled="!sel.count.value" @click="batchFav"><Heart :size="14"/>收藏</button>
      <button class="btn btn-secondary btn-sm" :disabled="!sel.count.value" @click="batchExport"><Download :size="14"/>导出</button>
      <button class="btn btn-danger btn-sm" :disabled="!sel.count.value" @click="batchDelete"><Trash2 :size="14"/>删除</button>
    </BatchBar>
    <ReportModal :report="reading" @close="reading = null"/>
  </div>
</template>
