<template>
  <div class="max-w-xl space-y-6">
    <h1 class="font-display text-gold-400 tracking-display-wide text-3xl">
      <LatinTerm id="configuratio" />
    </h1>
    <UiPanel as="form" class="space-y-4" @submit.prevent="save">
      <UiInput v-model="displayName" :label="$t('auth-display-name')" />
      <UiSelect v-model="language" :label="$t('auth-language')">
        <option value="en">{{ $t('language-en') }}</option>
        <option value="ru">{{ $t('language-ru') }}</option>
      </UiSelect>
      <div class="flex items-end gap-3">
        <UiInput
          v-model.number="goal"
          :label="$t('settings-goal')"
          type="number"
          min="1"
          max="7"
        />
        <span class="text-vanilla-100 pb-2">
          {{ $t('settings-goal-unit') }}
        </span>
      </div>
      <p v-if="saved" class="text-gold-400 text-sm">
        {{ $t('settings-saved') }}
      </p>
      <UiButton type="submit">
        {{ $t('settings-save') }}
      </UiButton>
    </UiPanel>
    <UiPanel>
      <p class="font-display text-gold-400 tracking-display-wide">
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
import { fluentLocale } from '@/i18n/fluent';
import { useAuthStore } from '@/stores/auth';
import { useDashboardStore } from '@/stores/dashboard';
import { formatLocalizedDateTime } from '@/utils/dates';

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
  const when = formatLocalizedDateTime(at, fluentLocale.value);
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
