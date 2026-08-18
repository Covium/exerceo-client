import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UnitSystem } from '@/utils/units';

const TERMS_KEY = 'exerceo.useLocalizedTerms';
const UNIT_SYSTEM_KEY = 'exerceo.unitSystem';

function readFlag(): boolean {
  return localStorage.getItem(TERMS_KEY) === '1';
}

function readUnitSystem(): UnitSystem {
  return localStorage.getItem(UNIT_SYSTEM_KEY) === 'imperial'
    ? 'imperial'
    : 'metric';
}

export const usePreferencesStore = defineStore('preferences', () => {
  const useLocalizedTerms = ref(readFlag());
  const unitSystem = ref<UnitSystem>(readUnitSystem());

  function setUseLocalizedTerms(value: boolean): void {
    useLocalizedTerms.value = value;
    localStorage.setItem(TERMS_KEY, value ? '1' : '0');
  }

  function setUnitSystem(value: UnitSystem): void {
    unitSystem.value = value;
    localStorage.setItem(UNIT_SYSTEM_KEY, value);
  }

  return {
    useLocalizedTerms,
    unitSystem,
    setUseLocalizedTerms,
    setUnitSystem,
  };
});
