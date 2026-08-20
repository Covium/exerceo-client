import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  api,
  ApiError,
  getToken,
  setToken,
  syncNativeSession,
} from '@/api/client';
import type { PublicUser } from '@/api/types';
import { setFluentLocale } from '@/i18n/fluent';
import { applyProfilePatch } from '@/offline/ledger';
import { isNetworkError } from '@/offline/network';
import { enqueue, flushOutbox, newId } from '@/offline/outbox';
import { clearSession, loadSession, saveSession } from '@/offline/storage';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<PublicUser | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => Boolean(user.value && getToken()));

  async function hydrate(): Promise<void> {
    if (!getToken()) {
      return;
    }
    syncNativeSession();
    const cached = loadSession();
    if (cached) {
      user.value = cached;
      setFluentLocale(cached.language);
    }
    try {
      user.value = await api.me();
      saveSession(user.value);
      setFluentLocale(user.value.language);
      await flushOutbox(user.value.id);
    } catch (cause) {
      if (isNetworkError(cause)) {
        return;
      }
      if (cause instanceof ApiError && cause.status === 401) {
        setToken(null);
        clearSession();
        user.value = null;
      }
    }
  }

  async function enter(payload: {
    login: string;
    password: string;
    displayName?: string;
    language?: string;
  }): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const result = await api.enter(payload);
      setToken(result.accessToken);
      user.value = result.user;
      saveSession(result.user);
      setFluentLocale(result.user.language);
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'auth-error';
      throw cause;
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(payload: {
    displayName?: string;
    language?: string;
    weeklyWorkoutGoal?: number;
  }): Promise<void> {
    if (!user.value) {
      return;
    }
    user.value = applyProfilePatch(user.value, payload);
    saveSession(user.value);
    setFluentLocale(user.value.language);
    enqueue(user.value.id, {
      id: newId(),
      type: 'updateProfile',
      payload,
    });
    try {
      await flushOutbox(user.value.id);
      const session = loadSession();
      if (session) {
        user.value = session;
        setFluentLocale(session.language);
      }
    } catch (cause) {
      if (!isNetworkError(cause)) {
        throw cause;
      }
    }
  }

  function signOut(): void {
    setToken(null);
    clearSession();
    user.value = null;
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    hydrate,
    enter,
    updateProfile,
    signOut,
  };
});
