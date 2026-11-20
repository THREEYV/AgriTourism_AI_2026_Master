<script setup>
import { LoaderCircle, Clock3 } from 'lucide-vue-next'
const props = defineProps({
  open: Boolean,
  elapsed: { type: Number, default: 0 },
  message: String,
  provider: String,
  error: String
})
const emit = defineEmits(['cancel', 'close'])
const mmss = v => `${String(Math.floor((v || 0) / 60)).padStart(2, '0')}:${String(Math.floor((v || 0) % 60)).padStart(2, '0')}`
</script>
<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="open" class="vg-mask">
        <div class="vg-card">
          <div class="vg-head">
            <h3>{{ error ? '视频生成失败' : '正在生成真实视频' }}</h3>
            <span class="vg-model">{{ provider }}</span>
          </div>
          <div class="vg-body">
            <div v-if="!error" class="vg-spin"><LoaderCircle :size="34" class="spin"/></div>
            <p v-if="!error" class="vg-phase">{{ message || '正在处理…' }}</p>
            <p v-else class="vg-error">{{ error }}</p>
            <p class="vg-time"><Clock3 :size="13"/> 已用时 {{ mmss(elapsed) }}</p>
            <p v-if="!error" class="vg-note">真实视频生成通常需要 <b>1–5 分钟</b>，请保持本页面打开，不要关闭或刷新。</p>
          </div>
          <div class="vg-actions">
            <button v-if="error" class="btn btn-primary" @click="emit('close')">关闭</button>
            <button v-else class="btn btn-secondary" @click="emit('cancel')">取消生成</button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.vg-mask {
  position: fixed; inset: 0; z-index: 200; display: grid; place-items: center;
  background: rgba(12, 24, 18, .45); backdrop-filter: blur(3px);
}
.vg-card {
  width: min(420px, calc(100vw - 40px)); background: #fff; border-radius: 18px;
  padding: 22px 24px 18px; box-shadow: 0 24px 60px rgba(16, 40, 27, .28);
}
.vg-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.vg-head h3 { margin: 0; font-size: 16px; color: #22392c; }
.vg-model { font-size: 10px; color: #4a8057; background: #edf5ef; padding: 4px 8px; border-radius: 20px; }
.vg-body { padding: 18px 0 6px; text-align: center; }
.vg-spin { display: grid; place-items: center; color: #246b4a; margin-bottom: 10px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.vg-phase { margin: 0 0 8px; font-size: 13px; color: #33513d; font-weight: 600; }
.vg-error { margin: 0 0 10px; font-size: 12px; color: #b23b3b; line-height: 1.7; word-break: break-word; }
.vg-time { display: flex; align-items: center; justify-content: center; gap: 5px; margin: 0 0 10px; font-size: 11px; color: #7c8c81; }
.vg-note { margin: 0; font-size: 11px; color: #8b9a90; line-height: 1.7; background: #f6f9f6; border-radius: 10px; padding: 9px 12px; }
.vg-note b { color: #4c6a55; }
.vg-actions { display: flex; justify-content: flex-end; margin-top: 14px; }
</style>
