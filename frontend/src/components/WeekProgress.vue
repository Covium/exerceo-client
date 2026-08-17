<template>
  <UiPanel>
    <div class="flex items-end justify-between gap-4">
      <div>
        <p class="font-display text-gold-400 text-xs tracking-[0.28em]">
          <LatinTerm id="haec-hebdomas" />
        </p>
        <p class="mt-1 text-lg">{{ $t('week-progress', { done, target }) }}</p>
      </div>
      <p class="text-vanilla-100">{{ Math.round(ratio * 100) }}%</p>
    </div>
    <div class="bg-ebony-700/50 mt-4 h-3">
      <div
        class="from-gold-600 to-gold-500 h-full bg-gradient-to-r shadow-[0_0_3px_1px_var(--color-gold-500)] transition-all duration-500"
        :style="{ width: `${Math.min(100, ratio * 100)}%` }"
      />
    </div>
    <div class="mt-3 grid grid-cols-7 gap-1">
      <HintTooltip
        v-for="day in days"
        :key="day.date"
        :text="day.date"
        class="min-w-0 [&_button]:block [&_button]:w-full"
      >
        <div
          class="h-2 w-full transition-all"
          :class="
            day.workedOut
              ? 'bg-gold-500 shadow-[0_0_3px_1px_var(--color-gold-500)]'
              : 'bg-ebony-700/50'
          "
        />
      </HintTooltip>
    </div>
  </UiPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import HintTooltip from '@/components/HintTooltip.vue';
import LatinTerm from '@/components/LatinTerm.vue';
import UiPanel from '@/components/UiPanel.vue';

const props = defineProps<{
  done: number;
  target: number;
  days: { date: string; workedOut: boolean }[];
}>();

const ratio = computed(() =>
  props.target <= 0 ? 0 : props.done / props.target,
);
</script>
