import { defineStore } from 'pinia';
import { ref } from 'vue';

const STORAGE_KEY = 'exerceo.useLocalizedTerms';

function readFlag(): boolean {
  return localStorage.getItem(STORAGE_KEY) === '1';
}

export const usePreferencesStore = defineStore('preferences', () => {
  const useLocalizedTerms = ref(readFlag());

  function setUseLocalizedTerms(value: boolean): void {
    useLocalizedTerms.value = value;
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  }

  return { useLocalizedTerms, setUseLocalizedTerms };
});
