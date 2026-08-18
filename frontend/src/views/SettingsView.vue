<template>
  <div class="max-w-xl space-y-6">
    <h1 class="font-display text-gold-400 text-3xl tracking-[0.18em]">
      <LatinTerm id="configuratio" />
    </h1>
    <UiPanel as="form" class="space-y-4" @submit.prevent="save">
      <label class="block text-sm">
        {{ $t('auth-display-name') }}
        <UiInput v-model="displayName" />
      </label>
      <label class="block text-sm">
        {{ $t('auth-language') }}
        <UiSelect v-model="language">
          <option value="en">{{ $t('language-en') }}</option>
          <option value="ru">{{ $t('language-ru') }}</option>
        </UiSelect>
      </label>
      <label class="block text-sm">
        {{ $t('settings-goal') }}
        <div class="mt-1 flex items-center gap-3">
          <UiInput
            v-model.number="goal"
            type="number"
            min="1"
            max="7"
            :block="false"
            class="w-24"
          />
          <span class="text-vanilla-100">{{ $t('settings-goal-unit') }}</span>
        </div>
      </label>
      <p v-if="saved" class="text-gold-400 text-sm">
        {{ $t('settings-saved') }}
      </p>
      <UiButton type="submit">
        {{ $t('settings-save') }}
      </UiButton>
    </UiPanel>
    <UiPanel>
      <p class="font-display text-gold-400 text-xs tracking-[0.28em]">
        {{ $t('health-title') }}
      </p>
      <p class="text-vanilla-100 mt-3 text-sm">{{ healthLabel }}</p>
      <p
        v-if="dashboard.healthStatus !== 'unavailable'"
        class="text-vanilla-100 mt-2 text-sm"
      >
        {{ lastSyncLabel }}
      </p>
      <p
        v-if="dashboard.healthError"
        class="border-gold-400 bg-gold-500/10 mt-3 border px-4 py-3 text-sm"
      >
        {{ $t(dashboard.healthError) }}
        <span
          v-if="dashboard.healthErrorDetail"
          class="text-vanilla-100 mt-2 block font-mono text-xs break-all"
        >
          {{ dashboard.healthErrorDetail }}
        </span>
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <UiButton
          v-if="dashboard.healthStatus === 'available'"
          variant="outline"
          size="sm"
          :disabled="dashboard.syncing"
          @click="dashboard.syncHealth()"
        >
          {{ dashboard.syncing ? $t('health-syncing') : $t('health-sync') }}
        </UiButton>
        <UiButton
          v-else-if="dashboard.healthStatus !== 'unavailable'"
          variant="outline"
          size="sm"
          @click="dashboard.connectHealth()"
        >
          {{ $t('health-permission') }}
        </UiButton>
      </div>
    </UiPanel>
    <button
      type="button"
      class="text-vanilla-100 hover:text-vanilla-50 text-sm"
      @click="signOut"
    >
      {{ $t('nav-sign-out') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useFluent } from 'fluent-vue';
import LatinTerm from '@/components/LatinTerm.vue';
import UiButton from '@/components/UiButton.vue';
import UiInput from '@/components/UiInput.vue';
import UiPanel from '@/components/UiPanel.vue';
import UiSelect from '@/components/UiSelect.vue';
import { useAuthStore } from '@/stores/auth';
import { useDashboardStore } from '@/stores/dashboard';

const { $t } = useFluent();
const auth = useAuthStore();
const dashboard = useDashboardStore();
const router = useRouter();
const displayName = ref(auth.user?.displayName ?? '');
const language = ref(auth.user?.language === 'ru' ? 'ru' : 'en');
const goal = ref(auth.user?.weeklyWorkoutGoal ?? 3);
const saved = ref(false);

const healthLabel = computed(() => {
  if (dashboard.healthStatus === 'available') {
    return $t('health-available');
  }
  if (dashboard.healthStatus === 'install') {
    return $t('health-install');
  }
  return $t('health-unavailable');
});

const lastSyncLabel = computed(() => {
  const at = dashboard.lastHealthSyncAt;
  if (!at) {
    return $t('health-never-synced');
  }
  const locale = auth.user?.language === 'ru' ? 'ru' : 'en';
  const when = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(at));
  return $t('health-last-sync', { when });
});

watch(
  () => auth.user,
  (user) => {
    if (!user) {
      return;
    }
    displayName.value = user.displayName;
    language.value = user.language === 'ru' ? 'ru' : 'en';
    goal.value = user.weeklyWorkoutGoal;
  },
);

async function save(): Promise<void> {
  await auth.updateProfile({
    displayName: displayName.value.trim(),
    language: language.value,
    weeklyWorkoutGoal: goal.value,
  });
  dashboard.paintFromCache();
  saved.value = true;
}

function signOut(): void {
  auth.signOut();
  void router.push({ name: 'enter' });
}

onMounted(() => {
  dashboard.paintFromCache();
});
</script>
