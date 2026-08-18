<template>
  <div class="space-y-6">
    <h1 class="font-display text-gold-400 tracking-display-wide text-3xl">
      <LatinTerm id="historia" />
    </h1>
    <WeekProgress
      v-if="dashboard.data"
      :done="dashboard.data.week.qualifyingDays"
      :target="dashboard.data.week.target"
      :days="dashboard.data.week.days"
    />
    <UiPanel>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-vanilla-100 text-sm">{{ $t('streak-weekly') }}</p>
          <RomanNumeral
            :value="dashboard.data?.streak.weekly ?? 0"
            unit="weeks"
          />
        </div>
        <div class="text-right">
          <p class="text-vanilla-100 text-sm">{{ $t('streak-daily') }}</p>
          <RomanNumeral
            :value="dashboard.data?.streak.daily ?? 0"
            unit="days"
          />
        </div>
      </div>
      <ul class="mt-6 space-y-2">
        <li
          v-for="day in dashboard.data?.week.days ?? []"
          :key="day.date"
          class="bg-ebony-950/40 flex items-center justify-between px-3 py-2"
        >
          <span>{{ formatLocalizedDate(day.date, fluentLocale) }}</span>
          <span :class="day.workedOut ? 'text-gold-400' : 'text-vanilla-100'">
            {{ day.workedOut ? '✓' : '·' }}
          </span>
        </li>
      </ul>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import LatinTerm from '@/components/LatinTerm.vue';
import RomanNumeral from '@/components/RomanNumeral.vue';
import UiPanel from '@/components/UiPanel.vue';
import WeekProgress from '@/components/WeekProgress.vue';
import { fluentLocale } from '@/i18n/fluent';
import { useDashboardStore } from '@/stores/dashboard';
import { formatLocalizedDate } from '@/utils/dates';

const dashboard = useDashboardStore();

onMounted(() => {
  if (!dashboard.data) {
    void dashboard.refresh();
  }
});
</script>
