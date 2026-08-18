<template>
  <label
    v-if="label"
    class="text-vanilla-100 flex flex-col gap-1 text-sm"
    :class="attrs.class"
  >
    {{ label }}
    <input
      :value="model"
      :class="inputClass"
      v-bind="inputAttrs"
      @input="onInput"
    />
  </label>
  <input
    v-else
    :value="model"
    :class="[inputClass, attrs.class]"
    v-bind="inputAttrs"
    @input="onInput"
  />
</template>

<script setup lang="ts" generic="T extends string | number">
import { computed, useAttrs } from 'vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    block?: boolean;
    label?: string;
  }>(),
  { block: true, label: undefined },
);

const [model, modifiers] = defineModel<T>();
const attrs = useAttrs();

const inputClass = computed(() => [
  'border-gold-700 ring-gold-400 bg-ebony-950 rounded-md border px-3 py-2 outline-none focus:ring-2',
  props.block ? 'w-full' : undefined,
]);

const inputAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class')),
);

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
