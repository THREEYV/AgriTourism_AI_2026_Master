<script setup>
import { onMounted } from 'vue'
import ToastHost from './components/ToastHost.vue'
import { useAppStore } from './stores/app'
import { products } from './data/products'
import { detectProductSafe } from './utils/vision'

// 旧版本生成的图生视频没有记录品类，会套用模板素材（香蕉图配苹果园）。
// 启动时只用“很确定”的颜色判断补一次，其余落到通用时令鲜货，避免再次套错具体农产品。
const store = useAppStore()
const isLegacy = v => !products.some(p => String(v.title || '').startsWith(p.name))

onMounted(async () => {
  // 每次启动都进入首页：清理之前版本记录的“上次页面”
  try { localStorage.removeItem('zn_last_route') } catch {}

  const list = store.videos.filter(v =>
    v.type === '图生视频' && v.kind !== '文旅' && v.thumb && (!v.productId || isLegacy(v)))
  if (!list.length) return
  for (const v of list) {
    try { v.productId = await detectProductSafe(v.thumb) } catch { v.productId = 'fresh' }
  }
  store.saveVideos()
})
</script>
<template>
  <!-- 顶层：登录页 ↔ 主框架之间的切换动画 -->
  <router-view v-slot="{ Component, route }">
    <transition name="fade" mode="out-in">
      <component :is="Component" :key="route.matched[0]?.path"/>
    </transition>
  </router-view>
  <ToastHost/>
</template>
