<template>
  <HintTooltip :text="tooltip">
    {{ label }}
  </HintTooltip>
</template>

<script setup lang="ts">
import { toRef } from 'vue';
import HintTooltip from '@/components/HintTooltip.vue';
import { useLatinTerm } from '@/composables/useLatinTerm';
import type { LatinTermId } from '@/i18n/terms';

const props = defineProps<{
  id: LatinTermId;
}>();

const { label, tooltip } = useLatinTerm(toRef(props, 'id'));
</script>
