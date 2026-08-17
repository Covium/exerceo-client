<template>
  <input
    :value="model"
    :class="[
      'border-gold-700 ring-gold-400 bg-ebony-950 mt-1 rounded-md border px-3 py-2 outline-none focus:ring-2',
      block ? 'w-full' : undefined,
    ]"
    @input="onInput"
  />
</template>

<script setup lang="ts" generic="T extends string | number">
withDefaults(
  defineProps<{
    block?: boolean;
  }>(),
  { block: true },
);

const [model, modifiers] = defineModel<T>();

function onInput(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }
  if (modifiers.number) {
    model.value = (target.value === '' ? 0 : target.valueAsNumber) as T;
    return;
  }
  model.value = target.value as T;
}
</script>
