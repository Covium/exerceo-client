<template>
  <div class="max-w-xl space-y-6">
    <h1 class="font-display text-gold-400 text-3xl tracking-[0.18em]">
      {{ $t('settings-title') }}
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
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import UiButton from '@/components/UiButton.vue';
import UiInput from '@/components/UiInput.vue';
import UiPanel from '@/components/UiPanel.vue';
import UiSelect from '@/components/UiSelect.vue';
import { useAuthStore } from '@/stores/auth';
import { useDashboardStore } from '@/stores/dashboard';

const auth = useAuthStore();
const dashboard = useDashboardStore();
const router = useRouter();
const displayName = ref(auth.user?.displayName ?? '');
const language = ref(auth.user?.language === 'ru' ? 'ru' : 'en');
const goal = ref(auth.user?.weeklyWorkoutGoal ?? 3);
const saved = ref(false);

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
</script>
