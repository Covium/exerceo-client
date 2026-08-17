<template>
  <button :type="type" :class="classes" :disabled="disabled">
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset';
    variant?: 'solid' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    pill?: boolean;
    disabled?: boolean;
  }>(),
  {
    type: 'button',
    variant: 'solid',
    size: 'md',
    pill: false,
    disabled: false,
  },
);

const classes = computed(() => {
  const variantClass =
    props.variant === 'outline'
      ? 'border-gold-600 hover:border-gold-500 border'
      : 'bg-gold-600 hover:bg-gold-500 text-ebony-900';
  const sizeClass =
    props.size === 'sm'
      ? 'px-3 py-1 text-sm'
      : props.size === 'lg'
        ? 'px-5 py-3'
        : 'px-4 py-2';
  return [
    variantClass,
    sizeClass,
    props.pill ? 'rounded-full' : 'rounded-md',
    'disabled:opacity-60 transition-colors',
  ];
});
</script>
