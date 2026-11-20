import { reactive } from 'vue'

// 轻量提示条，替代生硬的 window.alert
export const toastState = reactive({ list: [] })

export function toast(message, type = 'success', ms = 2400) {
  const id = Date.now() + Math.random()
  toastState.list.push({ id, message, type })
  setTimeout(() => {
    const i = toastState.list.findIndex(t => t.id === id)
    if (i > -1) toastState.list.splice(i, 1)
  }, ms)
}
