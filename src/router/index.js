import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import Home from '../views/Home.vue'
import Agriculture from '../views/Agriculture.vue'
import Tourism from '../views/Tourism.vue'
import VideoStudio from '../views/VideoStudio.vue'
import ModelCenter from '../views/ModelCenter.vue'
import Profile from '../views/Profile.vue'
import MyReports from '../views/MyReports.vue'
import MyVideos from '../views/MyVideos.vue'
import Favorites from '../views/Favorites.vue'
import Auth from '../views/Auth.vue'
import Settings from '../views/Settings.vue'

const routes = [
  { path: '/auth', component: Auth, meta: { standalone: true } },
  {
    path: '/', component: MainLayout, children: [
      { path: '', component: Home, meta: { title: '乡韵智创' } },
      { path: 'agriculture', component: Agriculture, meta: { title: 'AI 助农' } },
      { path: 'tourism', component: Tourism, meta: { title: 'AI 文旅' } },
      { path: 'video', component: VideoStudio, meta: { title: 'AI 视频创作' } },
      { path: 'models', component: ModelCenter, meta: { title: '模型服务中心' } },
      { path: 'profile', component: Profile, meta: { title: '个人中心' } },
      { path: 'profile/reports', component: MyReports, meta: { title: '我的分析报告' } },
      { path: 'profile/videos', component: MyVideos, meta: { title: '我的视频作品' } },
      { path: 'profile/favorites', component: Favorites, meta: { title: '我的收藏' } },
      { path: 'settings', component: Settings, meta: { title: '设置' } }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export default createRouter({
  history: createWebHistory(),
  routes,
  // 等离场动画结束后再滚动，避免页面“跳一下”
  scrollBehavior: (to, from, saved) => new Promise(resolve => {
    if (to.path === from.path) return resolve(false)
    setTimeout(() => resolve(saved || { top: 0 }), 180)
  })
})
