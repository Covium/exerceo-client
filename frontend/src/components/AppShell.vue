<template>
  <div
    class="border-gold-500 mx-auto flex h-dvh min-h-dvh max-w-5xl flex-col md:flex-row lg:border-x"
  >
    <aside
      class="border-gold-500 max-md:bg-ebony-950/75 sticky top-0 z-20 flex flex-col gap-3 border-b px-4 py-3 backdrop-blur-sm md:w-56 md:justify-between md:border-r md:border-b-0 md:px-6 md:py-8 md:backdrop-blur-none"
    >
      <div
        class="md:vertical-align-middle flex flex-col gap-1 md:order-2 md:[writing-mode:sideways-lr]"
      >
        <p
          class="font-display text-gold-400 text-3xl tracking-[0.18em] md:text-6xl"
        >
          <LatinTerm id="app-name" />
        </p>
        <p class="text-vanilla-100 hidden text-sm md:block md:text-2xl">
          {{ $t('tagline') }}
        </p>
      </div>

      <nav
        class="flex flex-row-reverse gap-2 overflow-x-auto md:flex-col md:gap-1"
      >
        <router-link
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="text-vanilla-50/80 hover:text-vanilla-50 border-b border-transparent p-1 text-sm whitespace-nowrap transition md:border-b-0 md:border-l md:px-3 md:py-2"
          exact-active-class="border-gold-400! text-gold-400!"
        >
          {{ $t(item.key) }}
        </router-link>
      </nav>
    </aside>

    <main
      class="flex-1 overflow-auto px-4 py-6 md:px-6 md:py-8"
      :class="{ 'pb-24': connectivity.unreachable }"
    >
      <router-view />
    </main>
  </div>
  <OfflineToast />
</template>

<script setup lang="ts">
import LatinTerm from '@/components/LatinTerm.vue';
import OfflineToast from '@/components/OfflineToast.vue';
import { useConnectivityStore } from '@/stores/connectivity';

const items = [
  { to: '/', key: 'nav-dashboard' },
  { to: '/history', key: 'nav-history' },
  { to: '/measurements', key: 'nav-measurements' },
  { to: '/groups', key: 'nav-groups' },
  { to: '/settings', key: 'nav-settings' },
];

const connectivity = useConnectivityStore();
</script>

<style scoped>
@media (min-width: 48rem) {
  aside {
    background: linear-gradient(
      90deg,
      color-mix(
          color-mix(in srgb, var(--color-white) 15%, var(--color-ebony-950)) 75%,
          transparent
        )
        0%,
      color-mix(var(--color-ebony-950) 75%, transparent) 7.5%,
      color-mix(var(--color-ebony-950) 75%, transparent) 92.5%,
      color-mix(
        color-mix(in srgb, var(--color-white) 15%, var(--color-ebony-950)) 75%,
        transparent
      )
    );
  }
}
</style>
