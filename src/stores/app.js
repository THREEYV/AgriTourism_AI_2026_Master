import { defineStore } from 'pinia'
import { buildAgricultureReport, buildTourismReport } from '../utils/mockAI'

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value))

// 旧数据可能没有 id，这里补齐，保证可以打开 / 删除 / 收藏
const withIds = list => (Array.isArray(list) ? list : []).map((x, i) =>
  x && x.id ? x : { ...x, id: Date.now() - (i + 1) * 1000 - Math.floor(Math.random() * 999) })

// 旧版收藏是字符串数组，统一升级为对象结构
const normFavs = list => (Array.isArray(list) ? list : []).map(f =>
  typeof f === 'string'
    ? { key: `template:${f}`, kind: 'template', refId: f, title: f, sub: '视频模板', date: new Date().toLocaleString() }
    : f)

const seedReports = () => [
  { ...buildAgricultureReport({ area: '青岛市崂山区', industry: '种植业' }), id: 1001, type: '农业分析', date: '示例数据' },
  { ...buildTourismReport({ province: '山东省', city: '青岛市', spot: '青山渔村' }), id: 1002, type: '文旅分析', date: '示例数据' }
]

const seedVideos = () => [
  { id: 1, title: '春日果园 · 特色农产品宣传', type: '模板创作', template: '农产品品牌宣传', kind: '助农', ratio: '9:16', duration: '15 秒', style: '清新自然', prompt: '展示果园风光、采摘过程和产品包装，突出自然、新鲜与产地特色。', status: '已完成', date: '刚刚' },
  { id: 2, title: '山野风光 · 乡村文旅短片', type: '文生视频', kind: '文旅', baseTemplate: '景区形象宣传', ratio: '16:9', duration: '30 秒', style: '电影质感', prompt: '晨雾中的山谷，溪水绕过村落，炊烟升起，夕阳下的梯田', status: '已完成', date: '昨天' }
]

export const useAppStore = defineStore('app', {
  state: () => ({
    user: read('zn_user', null),
    reports: withIds(read('zn_reports', null) ?? seedReports()),
    videos: withIds(read('zn_videos', null) ?? seedVideos()),
    apiConfigs: read('zn_apis', []),
    activeApiId: read('zn_active_api', ''),
    defaultModel: read('zn_default_model', 'DeepSeek-V4-Pro'),
    favorites: normFavs(read('zn_favorites', []))
  }),
  getters: {
    isLoggedIn: s => !!s.user,
    // 当前启用的自定义 API（真正会被调用的那一条）
    activeApi: s => s.apiConfigs.find(a => String(a.id) === String(s.activeApiId)) || null
  },
  actions: {
    login(user) { this.user = user; write('zn_user', user) },
    logout() { this.user = null; localStorage.removeItem('zn_user') },

    // —— 分析报告 ——
    addReport(report) {
      const rec = { ...report, id: Date.now() }
      this.reports.unshift(rec)
      write('zn_reports', this.reports)
      return rec
    },
    removeReports(ids) {
      const set = new Set(ids)
      this.reports = this.reports.filter(r => !set.has(r.id))
      this.favorites = this.favorites.filter(f => !(f.kind === 'report' && set.has(f.refId)))
      write('zn_reports', this.reports); write('zn_favorites', this.favorites)
    },

    // —— 视频作品 ——
    addVideo(video) {
      const rec = { ...video, id: Date.now(), date: new Date().toLocaleString() }
      this.videos.unshift(rec)
      write('zn_videos', this.videos)
      return rec
    },
    removeVideo(id) { this.removeVideos([id]) },
    removeVideos(ids) {
      const set = new Set(ids)
      this.videos = this.videos.filter(v => !set.has(v.id))
      this.favorites = this.favorites.filter(f => !(f.kind === 'video' && set.has(f.refId)))
      write('zn_videos', this.videos); write('zn_favorites', this.favorites)
    },
    renameVideo(id, title) {
      const v = this.videos.find(x => x.id === id)
      if (!v || !title.trim()) return
      v.title = title.trim()
      const f = this.favorites.find(x => x.key === `video:${id}`)
      if (f) f.title = v.title
      write('zn_videos', this.videos); write('zn_favorites', this.favorites)
    },

    // —— 收藏 ——  kind: 'report' | 'video' | 'template'
    isFav(kind, refId) { return this.favorites.some(f => f.key === `${kind}:${refId}`) },
    addFav({ kind, refId, title, sub }) {
      const key = `${kind}:${refId}`
      if (this.favorites.some(f => f.key === key)) return
      this.favorites.unshift({ key, kind, refId, title, sub, date: new Date().toLocaleString() })
      write('zn_favorites', this.favorites)
    },
    toggleFav(item) {
      const key = `${item.kind}:${item.refId}`
      if (this.favorites.some(f => f.key === key)) { this.removeFavs([key]); return false }
      this.addFav(item); return true
    },
    removeFavs(keys) {
      const set = new Set(keys)
      this.favorites = this.favorites.filter(f => !set.has(f.key))
      write('zn_favorites', this.favorites)
    },
    // 兼容旧接口
    toggleFavorite(name) { return this.toggleFav({ kind: 'template', refId: name, title: name, sub: '视频模板' }) },

    saveApis() { write('zn_apis', this.apiConfigs) },
    saveVideos() { write('zn_videos', this.videos) },
    setActiveApi(id) { this.activeApiId = id ? String(id) : ''; write('zn_active_api', this.activeApiId) },
    saveDefaultModel(v) { this.defaultModel = v; write('zn_default_model', v) }
  }
})
