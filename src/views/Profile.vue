<script setup>
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { toast } from '../utils/toast'
import { FileText, Video, Heart, ShoppingBag, Settings, ChevronRight, Sparkles, LogIn } from 'lucide-vue-next'
const store = useAppStore(), router = useRouter()
const items = [
  { name: '我的分析报告', desc: '查看、导出与管理农业和文旅分析记录', icon: FileText, path: '/profile/reports', count: () => store.reports.length },
  { name: '我的视频作品', desc: '播放预览、批量管理已生成的视频', icon: Video, path: '/profile/videos', count: () => store.videos.length },
  { name: '我的收藏', desc: '收藏的报告、作品与模板', icon: Heart, path: '/profile/favorites', count: () => store.favorites.length },
  { name: '会员与订单', desc: '查看订阅和订单信息', icon: ShoppingBag, path: 'membership' },
  { name: '设置', desc: '账户、安全与隐私设置', icon: Settings, path: '/settings' }
]
function go(path) {
  if (path.startsWith('/')) router.push(path)
  else toast('会员订单为演示页面，暂未接入支付', 'info')
}
</script>
<template>
  <div>
    <div class="page-heading"><div><span class="kicker">PERSONAL CENTER</span><h1>我的</h1><p>管理你的账户、作品与 AI 服务。</p></div></div>
    <div class="profile-card"><div class="profile-avatar">{{ store.user?.nickname?.slice(0, 1) || '访' }}</div><div class="profile-info"><h2>{{ store.user?.nickname || '体验用户' }}</h2><p>{{ store.user?.phone || '登录后同步个人数据' }}</p><span class="member-tag">✦ {{ store.user ? '普通会员' : '游客体验' }}</span></div><button v-if="!store.user" class="btn btn-light" @click="router.push('/auth')"><LogIn :size="16"/>登录 / 注册</button><button v-else class="text-btn light-text" @click="store.logout()">退出</button></div>
    <div class="stats-grid">
      <button @click="router.push('/profile/reports')"><b>{{ store.reports.length }}</b><small>分析报告</small></button>
      <button @click="router.push('/profile/videos')"><b>{{ store.videos.length }}</b><small>视频作品</small></button>
      <button @click="router.push('/profile/favorites')"><b>{{ store.favorites.length }}</b><small>我的收藏</small></button>
    </div>
    <div class="panel menu-panel"><button v-for="it in items" :key="it.name" class="menu-row" @click="go(it.path)"><div class="menu-icon"><component :is="it.icon" :size="20"/></div><div class="menu-copy"><b>{{ it.name }}</b><small>{{ it.desc }}</small></div><span v-if="it.count" class="menu-count">{{ it.count() }}</span><ChevronRight :size="18" class="muted"/></button></div>
    <div class="profile-promo" @click="router.push('/models')"><div class="promo-icon"><Sparkles :size="22"/></div><div><b>探索 AI 模型服务中心</b><small>官方聚合服务 · 自定义 API</small></div><ChevronRight :size="18"/></div>
  </div>
</template>
