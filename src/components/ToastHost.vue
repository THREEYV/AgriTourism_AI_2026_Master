<script setup>
import { CircleCheck, Info } from 'lucide-vue-next'
import { toastState } from '../utils/toast'
</script>
<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-host">
      <div v-for="t in toastState.list" :key="t.id" class="toast" :class="t.type">
        <CircleCheck v-if="t.type === 'success'" :size="16"/><Info v-else :size="16"/>
        <span>{{ t.message }}</span>
      </div>
    </TransitionGroup>
  </Teleport>
</template>
