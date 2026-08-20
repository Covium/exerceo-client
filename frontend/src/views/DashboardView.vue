<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-gold-400 tracking-display-wide text-3xl">
          <LatinTerm id="hodie" />
        </h1>
        <p class="text-vanilla-100 mt-1 text-sm">
          {{
            dashboard.data?.today.workedOut
              ? $t('today-complete')
              : $t('today-incomplete')
          }}
        </p>
      </div>
      <div class="text-right">
        <p class="text-vanilla-100 text-sm">{{ $t('streak-weekly') }}</p>
        <RomanNumeral
          :value="dashboard.data?.streak.weekly ?? 0"
          unit="weeks"
        />
      </div>
    </header>

    <p
      v-if="dashboard.error"
      class="border-gold-400 bg-gold-500/10 border px-4 py-3 text-sm"
    >
      {{ $t(dashboard.error) }}
      <span
        v-if="dashboard.errorDetail"
        class="text-vanilla-100 mt-2 block font-mono text-xs break-all"
      >
        {{ dashboard.errorDetail }}
      </span>
    </p>

    <p
      v-if="dashboard.spell"
      class="border-gold-400 bg-gold-500/10 border px-4 py-3"
    >
      {{ $t(dashboard.spell) }}
    </p>

    <div class="mb-12 flex flex-col items-center">
      <ExerceoButton
        :disabled="Boolean(dashboard.data?.today.workedOut)"
        @cast="onCast"
      />
    </div>

    <WeekProgress
      v-if="dashboard.data"
      :done="dashboard.data.week.qualifyingDays"
      :target="dashboard.data.week.target"
      :days="dashboard.data.week.days"
    />

    <section class="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        term="exercitio"
        :value="dashboard.data?.today.workoutMinutes || null"
        format="minutes"
      />
      <StatCard
        term="gradus"
        :value="formatNumber(dashboard.data?.today.steps)"
      />
      <StatCard
        term="caloriae"
        :value="formatNumber(dashboard.data?.today.activeCalories)"
      />
      <StatCard
        term="pondus"
        :value="weightValue"
        format="amount"
        :unit="weightUnitLabel"
      />
    </section>

    <GroupStatus
      v-if="dashboard.data?.groups.length"
      :groups="dashboard.data?.groups ?? []"
      :current-user-id="auth.user?.id ?? ''"
    />

    <UiPanel v-if="dashboard.data?.recentMeasurements.length">
      <p class="font-display text-gold-400 tracking-display-wide">
        <LatinTerm id="mensurae" />
      </p>
      <ul class="mt-3 space-y-2 text-sm">
        <li
          v-for="item in dashboard.data.recentMeasurements"
          :key="item.id"
          class="text-vanilla-50/90 flex justify-between gap-4"
        >
          <span>{{ $t(`measurement-${item.type}`) }}</span>
          <span>{{ formatMeasurement(item) }}</span>
        </li>
      </ul>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useFluent } from 'fluent-vue';
import ExerceoButton from '@/components/ExerceoButton.vue';
import GroupStatus from '@/components/GroupStatus.vue';
import LatinTerm from '@/components/LatinTerm.vue';
import RomanNumeral from '@/components/RomanNumeral.vue';
import StatCard from '@/components/StatCard.vue';
import UiPanel from '@/components/UiPanel.vue';
import WeekProgress from '@/components/WeekProgress.vue';
import type { Dashboard } from '@/api/types';
import { useAuthStore } from '@/stores/auth';
import { useDashboardStore } from '@/stores/dashboard';
import { usePreferencesStore } from '@/stores/preferences';
import {
  formatMeasurementNumber,
  isMeasurementType,
  measurementInUnit,
  unitFluentId,
  unitForType,
} from '@/utils/units';

const { $t } = useFluent();
const auth = useAuthStore();
const dashboard = useDashboardStore();
const preferences = usePreferencesStore();
const { unitSystem } = storeToRefs(preferences);

const weightUnit = computed(() => unitForType('weight', unitSystem.value));

const weightValue = computed(() => {
  const sample = latestWeightSample(dashboard.data);
  if (!sample) {
    return null;
  }
  return formatMeasurementNumber(
    measurementInUnit(sample.value, sample.unit, weightUnit.value),
  );
});

const weightUnitLabel = computed(() => $t(unitFluentId(weightUnit.value)));

function formatMeasurement(item: {
  type: string;
  value: number;
  unit: string;
}): string {
  const type = isMeasurementType(item.type) ? item.type : null;
  const target = type
    ? unitForType(type, unitSystem.value)
    : unitForType('weight', unitSystem.value);
  const converted = measurementInUnit(item.value, item.unit, target);
  return $t('measurement-amount', {
    value: formatMeasurementNumber(converted),
    unit: $t(unitFluentId(target)),
  });
}

function latestWeightSample(
  data: Dashboard | null,
): { value: number; unit: string } | null {
  if (!data) {
    return null;
  }
  const measured = [...data.recentMeasurements]
    .filter((item) => item.type === 'weight')
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0];
  const activity = [...(data.activityDays ?? [])]
    .filter((day) => day.weight !== null && day.weight !== undefined)
    .sort((left, right) => right.date.localeCompare(left.date))[0];
  if (measured && activity?.weight !== undefined && activity.weight !== null) {
    const measuredDate = measured.timestamp.slice(0, 10);
    if (measuredDate >= activity.date) {
      return { value: measured.value, unit: measured.unit };
    }
    return { value: activity.weight, unit: 'kg' };
  }
  if (measured) {
    return { value: measured.value, unit: measured.unit };
  }
  if (data.today.weight !== null && data.today.weight !== undefined) {
    return { value: data.today.weight, unit: 'kg' };
  }
  if (activity?.weight !== undefined && activity.weight !== null) {
    return { value: activity.weight, unit: 'kg' };
  }
  return null;
}

function formatNumber(value: number | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value.toLocaleString();
}

async function onCast(): Promise<void> {
  await dashboard.markToday();
}

onMounted(() => {
  void dashboard.refresh();
});
</script>
