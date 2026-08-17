<template>
  <span class="inline-block max-w-full">
    <button
      ref="triggerRef"
      type="button"
      class="tracking-inherit font-inherit cursor-help! bg-transparent p-0 text-start text-inherit"
      :aria-label="text"
      :aria-expanded="open"
      @mouseenter="onEnter"
      @mouseleave="onLeave"
      @click="onClick"
      @blur="open = false"
    >
      <slot />
    </button>

    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <span
          v-if="open"
          ref="tooltipRef"
          role="tooltip"
          class="box-decoration bg-ebony-900/75 text-vanilla-50 pointer-events-none absolute z-50 w-max max-w-[min(18rem,80vw)] px-3 py-1 text-start font-sans tracking-normal shadow-[0_0_2px_1px_var(--color-gold-500)] backdrop-blur-xs"
          :style="[tooltipStyle, frameStyle]"
          @vue:mounted="positionTooltip"
        >
          {{ text }}
        </span>
      </Transition>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import type { CSSProperties } from 'vue';
import { boxDecorationStyle } from '@/utils/boxDecoration';

const props = defineProps<{
  text: string;
}>();

const open = ref(false);
const triggerRef = ref<HTMLButtonElement | null>(null);
const tooltipRef = ref<HTMLElement | null>(null);
const tooltipStyle = ref<CSSProperties>({ left: '0px', top: '0px' });
const frameStyle = boxDecorationStyle('var(--color-gold-500)');

const VIEWPORT_PADDING = 8;
const GAP = 8;

function canHover(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function onEnter(): void {
  if (canHover()) {
    open.value = true;
  }
}

function onLeave(): void {
  if (canHover()) {
    open.value = false;
  }
}

function onClick(): void {
  if (!canHover()) {
    open.value = !open.value;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function positionTooltip(): void {
  const trigger = triggerRef.value;
  const tooltip = tooltipRef.value;
  if (!trigger || !tooltip) {
    return;
  }

  const triggerRect = trigger.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const width = tooltipRect.width;
  const height = tooltipRect.height;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  const viewportLeft = scrollX + VIEWPORT_PADDING;
  const viewportTop = scrollY + VIEWPORT_PADDING;
  const viewportRight = scrollX + window.innerWidth - VIEWPORT_PADDING;
  const viewportBottom = scrollY + window.innerHeight - VIEWPORT_PADDING;

  let left = triggerRect.left + scrollX + triggerRect.width / 2 - width / 2;
  let top = triggerRect.bottom + scrollY + GAP;

  if (top + height > viewportBottom) {
    const above = triggerRect.top + scrollY - GAP - height;
    if (
      above >= viewportTop ||
      triggerRect.top > window.innerHeight - triggerRect.bottom
    ) {
      top = above;
    }
  }

  left = clamp(left, viewportLeft, viewportRight - width);
  top = clamp(top, viewportTop, viewportBottom - height);

  tooltipStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
  };
}

function onReposition(): void {
  if (open.value) {
    positionTooltip();
  }
}

watch(
  () => props.text,
  () => {
    if (open.value) {
      positionTooltip();
    }
  },
);

onMounted(() => {
  window.addEventListener('scroll', onReposition, true);
  window.addEventListener('resize', onReposition);
});

onUnmounted(() => {
  window.removeEventListener('scroll', onReposition, true);
  window.removeEventListener('resize', onReposition);
});
</script>
