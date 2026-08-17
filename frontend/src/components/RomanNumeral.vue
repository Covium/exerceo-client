<template>
  <HintTooltip
    :text="tooltip"
    :class="[
      'font-display text-gold-400 text-4xl tracking-[0.2em]',
      props.class,
    ]"
  >
    {{ roman }}
  </HintTooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFluent } from 'fluent-vue';
import HintTooltip from '@/components/HintTooltip.vue';
import { toRoman } from '@/utils/roman';

const props = defineProps<{
  value: number;
  unit: 'weeks' | 'days';
  class?: string;
}>();

const { $t } = useFluent();
const roman = computed(() => toRoman(props.value));
const tooltip = computed(() =>
  props.unit === 'weeks'
    ? $t('streak-weeks', { count: props.value })
    : $t('streak-days', { count: props.value }),
);
</script>
