<script setup>
import { watch, onBeforeUnmount } from 'vue'
import { X } from 'lucide-vue-next'
const props = defineProps({ open: Boolean, title: String, width: { type: String, default: '760px' } })
const emit = defineEmits(['close'])
const onKey = e => { if (e.key === 'Escape') emit('close') }
watch(() => props.open, v => {
  document.body.style.overflow = v ? 'hidden' : ''
  v ? window.addEventListener('keydown', onKey) : window.removeEventListener('keydown', onKey)
}, { immediate: true })
onBeforeUnmount(() => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) })
</script>
<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="open" class="modal-mask" @click.self="emit('close')">
        <div class="modal-card" :style="{ maxWidth: width }" role="dialog" aria-modal="true">
          <header class="modal-head">
            <h3>{{ title }}</h3>
            <button class="icon-btn" aria-label="关闭" @click="emit('close')"><X :size="18"/></button>
          </header>
          <div class="modal-body"><slot/></div>
          <footer v-if="$slots.footer" class="modal-foot"><slot name="footer"/></footer>
        </div>
      </div>
    </transition>
  </Teleport>
</template>
