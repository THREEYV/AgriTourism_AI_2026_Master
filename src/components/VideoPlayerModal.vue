<script setup>
// 视频作品播放 / 详情弹窗
import { ref, computed, watch } from 'vue'
import { Heart, Download, Trash2, Pencil, Check, Clock3, Film, Palette, CalendarDays, Cpu } from 'lucide-vue-next'
import AppModal from './AppModal.vue'
import MockPlayer from './MockPlayer.vue'
import { videoView, plain, photo, shotMs } from '../data/templates'
import { useAppStore } from '../stores/app'
import { toast } from '../utils/toast'

const props = defineProps({ video: Object })
const emit = defineEmits(['close'])
const store = useAppStore()
const shown = ref(null)          // 关闭动画期间保留内容
const editing = ref(false), draft = ref('')
// 预览壳：抖音界面 / 纯净成片（纯净模式不含评论、点赞、小黄车等平台元素）
const showChrome = ref(true)
watch(() => props.video, v => { if (v) { shown.value = v; editing.value = false; showChrome.value = true } }, { immediate: true })
const view = computed(() => videoView(shown.value || {}))
const fav = computed(() => shown.value && store.isFav('video', shown.value.id))
// 分镜缩略图：优先上传图 → 场景图 → 封面，避免出现破图
const sceneThumb = s => (s.still && view.value.image) ? view.value.image : (photo(s.img, true) || view.value.cover)

function toggleFav() {
  const on = store.toggleFav({ kind: 'video', refId: shown.value.id, title: shown.value.title, sub: `${shown.value.type} · ${view.value.ratio}` })
  toast(on ? '已加入我的收藏' : '已取消收藏')
}
function startEdit() { draft.value = shown.value.title; editing.value = true }
function saveEdit() { store.renameVideo(shown.value.id, draft.value); editing.value = false; toast('名称已更新') }
function download() {
  if (shown.value?.videoUrl) { window.open(shown.value.videoUrl, '_blank'); return }
  toast('本地演示成片没有 MP4 文件；可切到「纯净成片」后录屏，或在生成时选择「API 真实生成」', 'info', 4200)
}
function remove() {
  if (!window.confirm(`确定删除「${shown.value.title}」吗？`)) return
  store.removeVideo(shown.value.id); toast('作品已删除'); emit('close')
}
</script>
<template>
  <AppModal :open="!!video" title="作品预览" width="820px" @close="emit('close')">
    <div v-if="shown" class="vp-layout">
      <div class="vp-stage">
        <!-- 真实 API 生成的成片：直接播放返回的视频 -->
        <video v-if="shown.videoUrl" class="vp-real" :src="shown.videoUrl" controls autoplay loop playsinline></video>
        <template v-else>
          <MockPlayer :key="shown.id" :scenes="view.scenes" :palette="view.palette" :ratio="view.ratio" :image="view.image" :meta="view.meta" :grade="view.style" :scene-ms="shotMs(view.duration, view.scenes.length)" :title="shown.title" badge="演示成片" :max-height="460" :chrome="showChrome"/>
          <div class="vp-chrome">
            <button class="chrome-chip" :class="{ on: showChrome }" @click="showChrome = true">抖音界面</button>
            <button class="chrome-chip" :class="{ on: !showChrome }" @click="showChrome = false">纯净成片</button>
          </div>
          <p class="vp-chrome-note">{{ showChrome ? '预览带评论、点赞、小黄车等平台元素；正式上传请切到「纯净成片」。' : '只保留画面、花字和字幕，上传抖音不会出现重复的评论 / 点赞 / 小黄车。' }}</p>
        </template>
      </div>
      <div class="vp-info">
        <div v-if="!editing" class="vp-title"><h2>{{ shown.title }}</h2><button class="icon-btn sm" title="重命名" @click="startEdit"><Pencil :size="14"/></button></div>
        <div v-else class="vp-title edit"><input v-model="draft" maxlength="40" @keyup.enter="saveEdit"><button class="icon-btn sm" title="保存" @click="saveEdit"><Check :size="14"/></button></div>
        <span class="status">{{ shown.status || '已完成' }}</span>
        <ul class="vp-meta">
          <li><Film :size="14"/>{{ shown.type }}<template v-if="shown.template"> · {{ shown.template }}</template></li>
          <li><Clock3 :size="14"/>{{ view.ratio }} · {{ view.duration }}</li>
          <li><Palette :size="14"/>{{ view.style }}</li>
          <li><CalendarDays :size="14"/>{{ shown.date }}</li>
          <li v-if="shown.model"><Cpu :size="14"/>文案模型 · {{ shown.model }}</li>
          <li v-if="shown.videoModel"><Cpu :size="14"/>视频模型 · {{ shown.videoModel }}</li>
        </ul>
        <div v-if="shown.prompt" class="vp-prompt"><small>创意描述</small><p>{{ shown.prompt }}</p></div>
        <div v-if="!shown.videoUrl" class="vp-scenes"><small>分镜</small><ol><li v-for="(s, i) in view.scenes" :key="i"><img :src="sceneThumb(s)" alt="" loading="lazy">{{ plain(s.caption) }}</li></ol></div>
        <div class="vp-actions">
          <button class="btn btn-secondary" :class="{ faved: fav }" @click="toggleFav"><Heart :size="15" :fill="fav ? 'currentColor' : 'none'"/>{{ fav ? '已收藏' : '收藏' }}</button>
          <button class="btn btn-secondary" @click="download"><Download :size="15"/>下载</button>
          <button class="btn btn-danger" @click="remove"><Trash2 :size="15"/>删除</button>
        </div>
      </div>
    </div>
  </AppModal>
</template>

<style scoped>
/* API 真实生成的视频：铺满舞台，保持比例 */
.vp-real {
  width: 100%;
  max-height: 520px;
  display: block;
  border-radius: 14px;
  background: #000;
  object-fit: contain;
}

/* 预览壳切换 */
.vp-chrome {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 12px;
}
.chrome-chip {
  border: 1px solid #d8e4da;
  background: #fff;
  color: #4d6155;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 11px;
}
.chrome-chip.on {
  background: #eaf3eb;
  border-color: #a7c8ad;
  color: #2f6b45;
  font-weight: 600;
}
.vp-chrome-note {
  margin: 8px 2px 0;
  font-size: 10px;
  line-height: 1.7;
  color: #94a097;
  text-align: center;
}
</style>
