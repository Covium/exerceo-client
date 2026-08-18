<template>
  <div class="flex min-h-dvh items-center justify-center px-4 py-10">
    <UiPanel
      as="form"
      padding="lg"
      class="w-full max-w-md"
      @submit.prevent="submit"
    >
      <p
        class="font-display text-gold-400 tracking-display-wide text-center text-4xl"
      >
        {{ $t('app-name') }}
      </p>
      <p class="text-vanilla-100 mt-2 text-center">{{ $t('tagline') }}</p>

      <UiInput
        v-model="login"
        class="mt-8"
        :label="$t('auth-login')"
        autocomplete="username"
        required
        minlength="3"
      />
      <UiInput
        v-model="password"
        class="mt-4"
        :label="$t('auth-password')"
        type="password"
        autocomplete="current-password"
        required
        minlength="8"
      />
      <UiInput
        v-model="displayName"
        class="mt-4"
        :label="$t('auth-display-name')"
        autocomplete="nickname"
      />
      <UiSelect
        v-model="language"
        class="mt-4"
        :label="$t('auth-language')"
        @change="onLanguage"
      >
        <option value="en">{{ $t('language-en') }}</option>
        <option value="ru">{{ $t('language-ru') }}</option>
      </UiSelect>

      <p class="text-vanilla-100 mt-4 text-sm">{{ $t('auth-hint') }}</p>
      <p v-if="auth.error" class="text-gold-300 mt-3 text-sm">
        {{ $t('auth-error') }}
      </p>

      <UiButton
        type="submit"
        size="lg"
        class="font-display tracking-display-wide mt-6 w-full"
        :disabled="auth.loading"
      >
        {{ $t('auth-submit') }}
      </UiButton>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import UiButton from '@/components/UiButton.vue';
import UiInput from '@/components/UiInput.vue';
import UiPanel from '@/components/UiPanel.vue';
import UiSelect from '@/components/UiSelect.vue';
import { setFluentLocale } from '@/i18n/fluent';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const login = ref('');
const password = ref('');
const displayName = ref('');
const language = ref<'en' | 'ru'>('en');

function onLanguage(): void {
  setFluentLocale(language.value);
}

async function submit(): Promise<void> {
  await auth.enter({
    login: login.value.trim(),
    password: password.value,
    displayName: displayName.value.trim() || undefined,
    language: language.value,
  });
  await router.push({ name: 'dashboard' });
}
</script>
