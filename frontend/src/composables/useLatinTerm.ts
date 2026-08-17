import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useFluent } from 'fluent-vue';
import { latinMessageId, type LatinTermId } from '@/i18n/terms';
import { usePreferencesStore } from '@/stores/preferences';

export function useLatinTerm(id: MaybeRefOrGetter<LatinTermId>) {
  const { $t, $ta } = useFluent();
  const preferences = usePreferencesStore();
  const messageId = computed(() => latinMessageId(toValue(id)));

  const latin = computed(() => $t(messageId.value));
  const gloss = computed(() => $ta(messageId.value).gloss ?? '');
  const showLatin = computed(() => !preferences.useLocalizedTerms);
  const label = computed(() => (showLatin.value ? latin.value : gloss.value));
  const tooltip = computed(() => (showLatin.value ? gloss.value : latin.value));

  return { latin, gloss, label, tooltip, showLatin };
}
