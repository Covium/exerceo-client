<template>
  <div class="space-y-6">
    <h1 class="font-display text-gold-400 tracking-display-wide text-3xl">
      <LatinTerm id="mensurae" />
    </h1>

    <UiPanel as="form" class="grid gap-3 md:grid-cols-4" @submit.prevent="add">
      <UiSelect v-model="type" :label="$t('measurements-type')">
        <option v-for="option in types" :key="option" :value="option">
          {{ $t(`measurement-${option}`) }}
        </option>
      </UiSelect>
      <UiInput
        v-model.number="value"
        :label="$t('measurements-value')"
        type="number"
        step="0.1"
        required
      />
      <UiSelect v-model="unit" :label="$t('measurements-unit')">
        <option v-for="option in availableUnits" :key="option" :value="option">
          {{ $t(unitFluentId(option)) }}
        </option>
      </UiSelect>
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
      <MeasurementChart :values="chartValues" />
      <ul v-if="filtered.length" class="mt-4 space-y-2 text-sm">
        <li
          v-for="item in [...filtered].reverse()"
          :key="item.id"
          class="flex items-center justify-between gap-3"
        >
          <span>
            {{ formatLocalizedDateTime(item.timestamp, fluentLocale) }}
          </span>
          <span>{{ formatItem(item) }}</span>
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
import { computed, onMounted, ref } from 'vue';
import { useFluent } from 'fluent-vue';
import MeasurementChart from '@/components/MeasurementChart.vue';
import LatinTerm from '@/components/LatinTerm.vue';
import UiButton from '@/components/UiButton.vue';
import UiInput from '@/components/UiInput.vue';
import UiPanel from '@/components/UiPanel.vue';
import UiSelect from '@/components/UiSelect.vue';
import { fluentLocale } from '@/i18n/fluent';
import { useMeasurementsStore } from '@/stores/measurements';
import { usePreferencesStore } from '@/stores/preferences';
import { formatLocalizedDateTime } from '@/utils/dates';
import {
  MEASUREMENT_TYPES,
  convertMeasurement,
  formatMeasurementNumber,
  measurementInUnit,
  systemFromUnit,
  unitFluentId,
  unitForType,
  unitsForType,
  type MeasurementType,
  type MeasurementUnit,
} from '@/utils/units';

const { $t } = useFluent();
const types = MEASUREMENT_TYPES;
const measurements = useMeasurementsStore();
const preferences = usePreferencesStore();
const type = ref<MeasurementType>('weight');
const value = ref<number>(0);
const filter = ref<MeasurementType>('weight');

const availableUnits = computed(() => unitsForType(type.value));

const unit = computed({
  get(): MeasurementUnit {
    return unitForType(type.value, preferences.unitSystem);
  },
  set(next: MeasurementUnit) {
    const previous = unitForType(type.value, preferences.unitSystem);
    if (previous !== next) {
      value.value = convertMeasurement(value.value, previous, next);
    }
    const system = systemFromUnit(next);
    if (system) {
      preferences.setUnitSystem(system);
    }
  },
});

const filtered = computed(() =>
  measurements.items.filter((item) => item.type === filter.value),
);

const displayUnit = computed(() =>
  unitForType(filter.value, preferences.unitSystem),
);

const chartValues = computed(() =>
  filtered.value.map((item) =>
    measurementInUnit(item.value, item.unit, displayUnit.value),
  ),
);

function formatItem(item: { value: number; unit: string }): string {
  const converted = measurementInUnit(item.value, item.unit, displayUnit.value);
  return $t('measurement-amount', {
    value: formatMeasurementNumber(converted),
    unit: $t(unitFluentId(displayUnit.value)),
  });
}

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

onMounted(() => {
  void measurements.load();
});
</script>
