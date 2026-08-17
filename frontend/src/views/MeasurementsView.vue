<template>
  <div class="space-y-6">
    <h1 class="font-display text-gold-400 text-3xl tracking-[0.18em]">
      <LatinTerm id="mensurae" />
    </h1>

    <UiPanel as="form" class="grid gap-3 md:grid-cols-4" @submit.prevent="add">
      <label class="text-sm">
        {{ $t('measurements-type') }}
        <UiSelect v-model="type">
          <option v-for="option in types" :key="option" :value="option">
            {{ $t(`measurement-${option}`) }}
          </option>
        </UiSelect>
      </label>
      <label class="text-sm">
        {{ $t('measurements-value') }}
        <UiInput v-model.number="value" type="number" step="0.1" required />
      </label>
      <label class="text-sm">
        {{ $t('measurements-unit') }}
        <UiInput v-model="unit" required />
      </label>
      <UiButton type="submit" class="self-end">
        {{ $t('measurements-add') }}
      </UiButton>
    </UiPanel>

    <UiPanel>
      <div class="mb-4 flex flex-wrap gap-2">
        <UiButton
          v-for="option in types"
          :key="option"
          :variant="filter === option ? 'solid' : 'outline'"
          size="sm"
          @click="filter = option"
        >
          {{ $t(`measurement-${option}`) }}
        </UiButton>
      </div>
      <MeasurementChart :values="filtered.map((item) => item.value)" />
      <ul class="mt-4 space-y-2 text-sm">
        <li
          v-for="item in [...filtered].reverse()"
          :key="item.id"
          class="flex items-center justify-between gap-3"
        >
          <span>{{ new Date(item.timestamp).toLocaleString() }}</span>
          <span>{{ item.value }} {{ item.unit }}</span>
          <button
            type="button"
            class="text-vanilla-100 hover:text-gold-300"
            @click="remove(item.id)"
          >
            ×
          </button>
        </li>
      </ul>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import MeasurementChart from '@/components/MeasurementChart.vue';
import LatinTerm from '@/components/LatinTerm.vue';
import UiButton from '@/components/UiButton.vue';
import UiInput from '@/components/UiInput.vue';
import UiPanel from '@/components/UiPanel.vue';
import UiSelect from '@/components/UiSelect.vue';
import { useMeasurementsStore } from '@/stores/measurements';

const types = ['weight', 'body_fat', 'waist', 'chest', 'arm', 'thigh'] as const;
const measurements = useMeasurementsStore();
const type = ref<(typeof types)[number]>('weight');
const value = ref<number>(0);
const unit = ref('kg');
const filter = ref<(typeof types)[number]>('weight');

const filtered = computed(() =>
  measurements.items.filter((item) => item.type === filter.value),
);

const units: Record<(typeof types)[number], string> = {
  weight: 'kg',
  body_fat: '%',
  waist: 'cm',
  chest: 'cm',
  arm: 'cm',
  thigh: 'cm',
};

async function add(): Promise<void> {
  await measurements.add({
    type: type.value,
    value: value.value,
    unit: unit.value,
    timestamp: new Date().toISOString(),
  });
  value.value = 0;
}

async function remove(id: string): Promise<void> {
  await measurements.remove(id);
}

watch(type, (next) => {
  unit.value = units[next];
});

onMounted(() => {
  unit.value = units[type.value];
  void measurements.load();
});
</script>
