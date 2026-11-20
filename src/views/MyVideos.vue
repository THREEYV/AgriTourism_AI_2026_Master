<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ListChecks, Heart, Download, Trash2, Check, Plus, Clapperboard } from 'lucide-vue-next'
import SubPageHeader from '../components/SubPageHeader.vue'
import VideoCover from '../components/VideoCover.vue'
import VideoPlayerModal from '../components/VideoPlayerModal.vue'
import BatchBar from '../components/BatchBar.vue'
import { useSelection } from '../composables/useSelection'
import { videoView } from '../data/templates'
import { useAppStore } from '../stores/app'
import { toast } from '../utils/toast'

const store = useAppStore(), router = useRouter()
const keyword = ref(''), type = ref('全部'), sort = ref('new')
const types = ['全部', '模板创作', '文生视频', '图生视频']
const countOf = t => t === '全部' ? store.videos.length : store.videos.filter(v => v.type === t).length

const list = computed(() => {
  const k = keyword.value.trim()
  let arr = store.videos.filter(v => (type.value === '全部' || v.type === type.value) && (!k || v.title.includes(k) || (v.prompt || '').includes(k)))
  if (sort.value === 'old') arr = [...arr].reverse()
  if (sort.value === 'name') arr = [...arr].sort((a, b) => a.title.localeCompare(b.title, 'zh'))
  return arr
})
const sel = useSelection(list)
const playing = ref(null)

function open(v) { sel.managing.value ? sel.toggle(v) : (playing.value = v) }
function batchFav() {
  sel.selectedItems.value.forEach(v => store.addFav({ kind: 'video', refId: v.id, title: v.title, sub: `${v.type} · ${videoView(v).ratio}` }))
  toast(`已收藏 ${sel.count.value} 个作品`)
}
function batchDownload() { toast(`已加入下载队列 ${sel.count.value} 个（演示版本不生成真实文件）`, 'info', 3000) }
function batchDelete() {
  const n = sel.count.value
  if (!window.confirm(`确定删除选中的 ${n} 个作品吗？此操作不可恢复。`)) return
  store.removeVideos(sel.selectedItems.value.map(v => v.id)); sel.clear(); toast(`已删除 ${n} 个作品`)
  if (!store.videos.length) sel.stop()
}
</script>
<template>
  <div>
    <SubPageHeader kicker="MY WORKS" title="我的视频作品" :desc="`共 ${store.videos.length} 个作品，点击即可播放预览`">
      <button class="btn btn-primary btn-sm" @click="router.push('/video')"><Plus :size="15"/>新建视频</button>
    </SubPageHeader>

    <div class="toolbar">
      <label class="search-box"><Search :size="15"/><input v-model="keyword" placeholder="搜索作品名称或描述"></label>
      <select v-model="sort" class="sort-select"><option value="new">最新优先</option><option value="old">最早优先</option><option value="name">按名称</option></select>
      <button class="btn btn-sm" :class="sel.managing.value ? 'btn-primary' : 'btn-secondary'" @click="sel.managing.value ? sel.stop() : sel.start()" :disabled="!store.videos.length">
        <ListChecks :size="15"/>{{ sel.managing.value ? '退出管理' : '批量管理' }}
      </button>
    </div>
    <div class="chip-group filter-row">
      <button v-for="t in types" :key="t" class="choice-chip" :class="{ chosen: type === t }" @click="type = t">{{ t }} <em>{{ countOf(t) }}</em></button>
    </div>

    <TransitionGroup v-if="list.length" name="list" tag="div" class="work-grid" :class="{ managing: sel.managing.value }">
      <div v-for="v in list" :key="v.id" class="work-card" :class="{ checked: sel.isSel(v) }" @click="open(v)">
        <div class="work-cover-wrap">
          <VideoCover :video="v" size="lg"/>
          <span v-if="sel.managing.value" class="checkbox corner" :class="{ on: sel.isSel(v) }"><Check v-if="sel.isSel(v)" :size="12"/></span>
          <Heart v-else-if="store.isFav('video', v.id)" class="fav-mark" :size="16" fill="currentColor"/>
        </div>
        <div class="work-info"><b>{{ v.title }}</b><small>{{ v.type }} · {{ v.date }}</small></div>
      </div>
    </TransitionGroup>
    <div v-else class="empty-state big">
      <Clapperboard :size="34"/>
      <b>{{ store.videos.length ? '没有符合条件的作品' : '还没有视频作品' }}</b>
      <small>{{ store.videos.length ? '换个关键词或分类试试' : '选择一个模板，一分钟生成第一条宣传视频' }}</small>
      <button v-if="!store.videos.length" class="btn btn-primary btn-sm" @click="router.push('/video')">去创作</button>
    </div>

    <BatchBar :show="sel.managing.value" :count="sel.count.value" :all-selected="sel.allSelected.value" @toggle-all="sel.toggleAll()" @done="sel.stop()">
      <button class="btn btn-secondary btn-sm" :disabled="!sel.count.value" @click="batchFav"><Heart :size="14"/>收藏</button>
      <button class="btn btn-secondary btn-sm" :disabled="!sel.count.value" @click="batchDownload"><Download :size="14"/>下载</button>
      <button class="btn btn-danger btn-sm" :disabled="!sel.count.value" @click="batchDelete"><Trash2 :size="14"/>删除</button>
    </BatchBar>
    <VideoPlayerModal :video="playing" @close="playing = null"/>
  </div>
</template>
