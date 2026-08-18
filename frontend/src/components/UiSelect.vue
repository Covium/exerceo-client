<template>
  <label
    v-if="label"
    class="text-vanilla-100 flex flex-col gap-1 text-sm"
    :class="attrs.class"
  >
    {{ label }}
    <select v-model="model" :class="selectClass" v-bind="selectAttrs">
      <slot />
    </select>
  </label>
  <select
    v-else
    v-model="model"
    :class="[selectClass, attrs.class]"
    v-bind="selectAttrs"
  >
    <slot />
  </select>
</template>

<script setup lang="ts" generic="T extends string">
import { computed, useAttrs } from 'vue';

defineOptions({ inheritAttrs: false });

withDefaults(
  defineProps<{
    label?: string;
  }>(),
  { label: undefined },
);

const model = defineModel<T>();
const attrs = useAttrs();

const selectClass =
  'border-gold-700 ring-gold-400 bg-ebony-950 w-full rounded-md border px-3 py-2 outline-none focus:ring-2';

const selectAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class')),
);
</script>
