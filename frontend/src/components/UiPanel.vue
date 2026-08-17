<template>
  <component
    :is="as"
    :class="[
      'box-decoration bg-stone-950/70',
      padding === 'lg' ? 'p-8' : 'p-4',
    ]"
    :style="frameStyle"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { boxDecorationStyle } from '@/utils/boxDecoration';

withDefaults(
  defineProps<{
    as?: 'div' | 'section' | 'article' | 'form';
    padding?: 'md' | 'lg';
  }>(),
  {
    as: 'section',
    padding: 'md',
  },
);

const frameStyle = boxDecorationStyle('var(--color-gold-500)');
</script>
