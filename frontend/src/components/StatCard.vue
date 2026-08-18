<template>
  <UiPanel as="article">
    <p class="font-display text-gold-400 text-xs tracking-[0.28em]">
      <LatinTerm :id="term" />
    </p>
    <p class="font-display text-vanilla-50 mt-3 text-3xl">{{ display }}</p>
  </UiPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFluent } from 'fluent-vue';
import LatinTerm from '@/components/LatinTerm.vue';
import UiPanel from '@/components/UiPanel.vue';
import type { LatinTermId } from '@/i18n/terms';

const props = defineProps<{
  term: LatinTermId;
  value: string | number | null | undefined;
  format?: 'minutes' | 'amount' | 'percent' | 'plain';
  unit?: string;
}>();

const { $t } = useFluent();
const display = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '') {
    return $t('card-empty');
  }
  if (props.format === 'minutes') {
    return $t('card-minutes', { value: props.value });
  }
  if (props.format === 'amount') {
    return $t('measurement-amount', {
      value: props.value,
      unit: props.unit ?? '',
    });
  }
  if (props.format === 'percent') {
    return $t('card-percent', { value: props.value });
  }
  return String(props.value);
});
</script>
