<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useDashboardStore } from '@/stores/dashboard';

const dashboard = useDashboardStore();

onMounted(() => {
  void dashboard.promptHealthAccessOnce();
});
</script>
