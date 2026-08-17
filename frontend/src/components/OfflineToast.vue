<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="connectivity.unreachable"
      class="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4"
    >
      <p
        class="box-decoration bg-ebony-950/95 text-vanilla-50 pointer-events-auto max-w-lg px-4 py-3 text-sm shadow-lg backdrop-blur-sm"
        :style="frameStyle"
      >
        <span class="block font-medium">{{ $t('error-network') }}</span>
        <span class="text-vanilla-100 mt-1 block">
          {{ $t('offline-toast-sync') }}
        </span>
      </p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useConnectivityStore } from '@/stores/connectivity';
import { boxDecorationStyle } from '@/utils/boxDecoration';

const connectivity = useConnectivityStore();
const frameStyle = boxDecorationStyle('var(--color-gold-800)');
</script>
