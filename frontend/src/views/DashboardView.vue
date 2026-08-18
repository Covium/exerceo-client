<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-gold-400 text-3xl tracking-[0.18em]">
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
        :value="dashboard.data?.today.weight"
        format="kg"
      />
    </section>

    <GroupStatus
      v-for="group in dashboard.data?.groups ?? []"
      :key="group.id"
      :group="group"
      :current-user-id="auth.user?.id ?? ''"
    />

    <UiPanel v-if="dashboard.data?.recentMeasurements.length">
      <p class="font-display text-gold-400 text-xs tracking-[0.28em]">
        <LatinTerm id="mensurae" />
      </p>
      <ul class="mt-3 space-y-2 text-sm">
        <li
          v-for="item in dashboard.data.recentMeasurements"
          :key="item.id"
          class="text-vanilla-50/90 flex justify-between gap-4"
        >
          <span>{{ item.type }}</span>
          <span>{{ item.value }} {{ item.unit }}</span>
        </li>
      </ul>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import ExerceoButton from '@/components/ExerceoButton.vue';
import GroupStatus from '@/components/GroupStatus.vue';
import LatinTerm from '@/components/LatinTerm.vue';
import RomanNumeral from '@/components/RomanNumeral.vue';
import StatCard from '@/components/StatCard.vue';
import UiPanel from '@/components/UiPanel.vue';
import WeekProgress from '@/components/WeekProgress.vue';
import { useAuthStore } from '@/stores/auth';
import { useDashboardStore } from '@/stores/dashboard';

const auth = useAuthStore();
const dashboard = useDashboardStore();

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
