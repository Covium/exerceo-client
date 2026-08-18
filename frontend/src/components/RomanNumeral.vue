<template>
  <HintTooltip
    :text="tooltip"
    :class="[
      'font-display text-gold-400 tracking-display-wider text-4xl',
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
