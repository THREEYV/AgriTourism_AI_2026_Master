<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Sprout, Compass, House, UserRound, Sparkles, ArrowLeft } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
const route = useRoute(), router = useRouter(), store = useAppStore()
const nav = [
  { label: '首页', path: '/', icon: House },
  { label: '助农', path: '/agriculture', icon: Sprout },
  { label: '文旅', path: '/tourism', icon: Compass },
  { label: '我的', path: '/profile', icon: UserRound }
]
const title = computed(() => route.meta.title || '乡韵智创')
const isActive = item => route.path === item.path || (item.path !== '/' && route.path.startsWith(item.path))

// 四个主标签之外的页面（模型中心、设置、我的报告等）显示返回按钮
const MAIN_PATHS = ['/', '/agriculture', '/tourism', '/profile']
const showBack = computed(() => !MAIN_PATHS.includes(route.path))
function goBack() {
  if (window.history.state?.back) router.back()
  else router.push('/')
}
</script>
<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="top-left">
        <button v-if="showBack" class="icon-btn top-back" title="返回上一页" aria-label="返回上一页" @click="goBack"><ArrowLeft :size="19"/></button>
        <div class="brand" @click="router.push('/')"><div class="brand-mark"><Sprout :size="21"/></div><div><b>乡韵智创</b><small>XiangYun AI</small></div></div>
      </div>
      <div class="top-actions">
        <transition name="fade" mode="out-in"><span class="top-caption" :key="title">{{ title }}</span></transition>
        <button class="icon-btn" title="模型服务" @click="router.push('/models')"><Sparkles :size="19"/></button>
        <button class="avatar" @click="router.push('/profile')">{{ store.user?.nickname?.slice(0, 1) || '访' }}</button>
      </div>
    </header>
    <main class="page-wrap">
      <router-view v-slot="{ Component, route: r }">
        <transition name="page" mode="out-in">
          <component :is="Component" :key="r.path"/>
        </transition>
      </router-view>
    </main>
    <nav class="bottom-nav">
      <button v-for="item in nav" :key="item.path" :class="{ active: isActive(item) }" @click="router.push(item.path)">
        <span class="nav-ind"></span>
        <component :is="item.icon" :size="21"/><span>{{ item.label }}</span>
      </button>
    </nav>
    <footer class="desktop-footer">乡韵智创 · AI赋能乡村产业，智创农文旅新未来</footer>
  </div>
</template>
