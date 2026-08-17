<template>
  <select
    v-model="model"
    class="border-gold-700 ring-gold-400 bg-ebony-950 mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
  >
    <slot />
  </select>
</template>

<script setup lang="ts" generic="T extends string">
const model = defineModel<T>();
</script>
