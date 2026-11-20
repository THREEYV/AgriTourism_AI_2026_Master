import { ref, computed } from 'vue'

/** 列表批量选择（批量管理模式） */
export function useSelection(listRef, key = x => x.id) {
  const managing = ref(false)
  const selected = ref(new Set())

  const isSel = item => selected.value.has(key(item))
  const selectedItems = computed(() => listRef.value.filter(isSel))
  const count = computed(() => selectedItems.value.length)
  const allSelected = computed(() => listRef.value.length > 0 && listRef.value.every(isSel))

  function toggle(item) {
    const s = new Set(selected.value)
    const k = key(item)
    s.has(k) ? s.delete(k) : s.add(k)
    selected.value = s
  }
  function toggleAll() {
    selected.value = allSelected.value ? new Set() : new Set(listRef.value.map(key))
  }
  function clear() { selected.value = new Set() }
  function start() { managing.value = true; clear() }
  function stop() { managing.value = false; clear() }

  return { managing, selected, selectedItems, count, allSelected, isSel, toggle, toggleAll, clear, start, stop }
}
