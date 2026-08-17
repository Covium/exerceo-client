<template>
  <svg
    v-if="points.length > 1"
    class="text-gold-400 h-40 w-full"
    viewBox="0 0 320 160"
    role="img"
    :aria-label="$t('measurements-history')"
  >
    <polyline
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      :points="polyline"
    />
    <circle
      v-for="(point, index) in points"
      :key="index"
      :cx="point.x"
      :cy="point.y"
      r="3.5"
      fill="#f6f6ef"
      stroke="currentColor"
    />
  </svg>
  <p v-else class="text-vanilla-100">{{ $t('measurements-empty') }}</p>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  values: number[];
}>();

const points = computed(() => {
  if (props.values.length === 0) {
    return [];
  }
  const min = Math.min(...props.values);
  const max = Math.max(...props.values);
  const span = max - min || 1;
  return props.values.map((value, index) => {
    const x =
      props.values.length === 1
        ? 160
        : (index / (props.values.length - 1)) * 300 + 10;
    const y = 140 - ((value - min) / span) * 120;
    return { x, y };
  });
});

const polyline = computed(() =>
  points.value.map((point) => `${point.x},${point.y}`).join(' '),
);
</script>
