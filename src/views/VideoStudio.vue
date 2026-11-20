<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Clapperboard } from 'lucide-vue-next'
import VideoCreator from '../components/VideoCreator.vue'
import { templates } from '../data/templates'
const route = useRoute()
const initial = computed(() => route.query.template || undefined)
</script>
<template>
  <div>
    <div class="page-heading">
      <div><span class="kicker">AI VIDEO STUDIO</span><h1>AI 视频创作</h1><p>选择模板快速制作，或用文字与图片开启创作。</p></div>
      <div class="heading-art purple-art"><Clapperboard :size="46"/></div>
    </div>
    <VideoCreator :templates="templates" :initial-template="initial" filter-kinds accent="purple"/>
  </div>
</template>
