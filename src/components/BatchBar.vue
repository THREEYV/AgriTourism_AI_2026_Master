<script setup>
import { Check } from 'lucide-vue-next'
defineProps({ show: Boolean, count: Number, allSelected: Boolean })
defineEmits(['toggle-all', 'done'])
</script>
<template>
  <Teleport to="body">
    <transition name="bar">
      <div v-if="show" class="batch-bar">
        <button class="check-all" @click="$emit('toggle-all')">
          <span class="checkbox" :class="{ on: allSelected }"><Check v-if="allSelected" :size="12"/></span>全选
        </button>
        <span class="batch-count">已选 <b>{{ count }}</b> 项</span>
        <div class="batch-actions"><slot/></div>
        <button class="btn btn-secondary btn-sm" @click="$emit('done')">完成</button>
      </div>
    </transition>
  </Teleport>
</template>
