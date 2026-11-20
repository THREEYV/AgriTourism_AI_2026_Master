<script setup>
// 视频缩略封面（列表 / 卡片使用）：取作品首个镜头的实拍画面，图生视频则用上传的图片
import { computed } from 'vue'
import { Play } from 'lucide-vue-next'
import { videoView } from '../data/templates'
const props = defineProps({ video: { type: Object, required: true }, size: { type: String, default: 'sm' } })
const view = computed(() => videoView(props.video))
</script>
<template>
  <div class="video-cover" :class="size" :style="{ background: `linear-gradient(150deg, ${view.palette[0]}, ${view.palette[1]})` }">
    <img v-if="view.cover" :src="view.cover" alt="" loading="lazy" draggable="false">
    <span class="video-cover-play"><Play :size="size === 'sm' ? 12 : 18"/></span>
    <small v-if="size !== 'sm'" class="video-cover-meta">{{ view.ratio }} · {{ view.duration.replace(' ', '') }}</small>
  </div>
</template>
