<script setup>
// 分析报告详情弹窗：完整阅读、复制、导出、收藏、删除
import { ref, computed, watch } from 'vue'
import { Copy, Download, Heart, Trash2 } from 'lucide-vue-next'
import AppModal from './AppModal.vue'
import { useAppStore } from '../stores/app'
import { toast } from '../utils/toast'
import { reportToText, downloadText } from '../utils/mockAI'

const props = defineProps({ report: Object })
const emit = defineEmits(['close'])
const store = useAppStore()
const shown = ref(null)
watch(() => props.report, r => { if (r) shown.value = r }, { immediate: true })
const fav = computed(() => shown.value && store.isFav('report', shown.value.id))

async function copy() {
  try { await navigator.clipboard.writeText(reportToText(shown.value)); toast('报告内容已复制') }
  catch { toast('浏览器不允许访问剪贴板，请使用导出功能', 'info') }
}
function exportTxt() { downloadText(`${shown.value.title}.txt`, reportToText(shown.value)); toast('报告已导出为文本文件') }
function toggleFav() {
  const on = store.toggleFav({ kind: 'report', refId: shown.value.id, title: shown.value.title, sub: shown.value.type })
  toast(on ? '已加入我的收藏' : '已取消收藏')
}
function remove() {
  if (!window.confirm('确定删除这份报告吗？')) return
  store.removeReports([shown.value.id]); toast('报告已删除'); emit('close')
}
</script>
<template>
  <AppModal :open="!!report" title="分析报告" width="720px" @close="emit('close')">
    <article v-if="shown" class="report-doc">
      <div class="report-doc-head">
        <span class="type-badge" :class="shown.type === '文旅分析' ? 'tourism' : 'agri'">{{ shown.type || '分析报告' }}</span>
        <small>{{ shown.date }}</small>
      </div>
      <h2>{{ shown.title }}</h2>
      <p class="report-summary">{{ shown.summary }}</p>
      <div v-for="(s, i) in shown.sections" :key="s[0]" class="report-section">
        <h3><span>{{ String(i + 1).padStart(2, '0') }}</span>{{ s[0] }}</h3><p>{{ s[1] }}</p>
      </div>
    </article>
    <template #footer>
      <button class="btn btn-danger" @click="remove"><Trash2 :size="15"/>删除</button>
      <span class="spacer"></span>
      <button class="btn btn-secondary" :class="{ faved: fav }" @click="toggleFav"><Heart :size="15" :fill="fav ? 'currentColor' : 'none'"/>{{ fav ? '已收藏' : '收藏' }}</button>
      <button class="btn btn-secondary" @click="copy"><Copy :size="15"/>复制</button>
      <button class="btn btn-primary" @click="exportTxt"><Download :size="15"/>导出</button>
    </template>
  </AppModal>
</template>
