<script setup>
defineProps({ kicker: String, title: String, desc: String })
</script>
<template>
  <div class="subpage-head">
    <div class="subpage-copy"><span class="kicker">{{ kicker }}</span><h1>{{ title }}</h1><p v-if="desc">{{ desc }}</p></div>
    <div class="subpage-extra"><slot/></div>
  </div>
</template>
