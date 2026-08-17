<template>
  <button
    type="button"
    class="border-gold-500 text-gold-400 relative aspect-square w-full max-w-100 animate-pulse overflow-hidden rounded-full border-3 p-8 transition disabled:animate-none disabled:cursor-not-allowed disabled:brightness-25"
    :disabled="disabled || casting"
    @click="cast"
  >
    <span class="font-display relative z-10 text-5xl md:text-6xl">
      {{ label }}
    </span>
    <p class="text-vanilla-100 text-center text-sm">
      {{ $t('exerceo-hint') }}
    </p>
    <span
      class="pointer-events-none absolute inset-0 origin-left scale-x-0 transition-transform duration-500"
      :class="casting ? 'scale-x-100' : 'scale-x-0'"
    />
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useFluent } from 'fluent-vue';

const props = defineProps<{
  disabled?: boolean;
}>();
const emit = defineEmits<{
  cast: [];
}>();

const { $t } = useFluent();
const casting = ref(false);
const label = computed(() =>
  casting.value ? $t('exerceo-casting') : $t('exerceo-button'),
);

async function cast(): Promise<void> {
  if (casting.value || props.disabled) {
    return;
  }
  casting.value = true;
  emit('cast');
  window.setTimeout(() => {
    casting.value = false;
  }, 700);
}
</script>
