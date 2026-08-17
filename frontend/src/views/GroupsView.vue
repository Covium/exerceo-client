<template>
  <div class="space-y-6">
    <h1 class="font-display text-gold-400 text-3xl tracking-[0.18em]">
      <LatinTerm id="cohors" />
    </h1>

    <UiPanel v-if="dashboard.data?.pendingInvitations.length" class="space-y-3">
      <article
        v-for="invitation in dashboard.data.pendingInvitations"
        :key="invitation.id"
        class="flex flex-wrap items-center justify-between gap-3"
      >
        <p>
          {{
            $t('invitation-from', {
              name: invitation.fromUser.displayName,
              group: invitation.group.name,
            })
          }}
        </p>
        <div class="flex gap-2">
          <UiButton
            size="sm"
            pill
            :disabled="connectivity.unreachable"
            @click="accept(invitation.id)"
          >
            {{ $t('invitation-accept') }}
          </UiButton>
          <UiButton
            variant="outline"
            size="sm"
            pill
            :disabled="connectivity.unreachable"
            @click="decline(invitation.id)"
          >
            {{ $t('invitation-decline') }}
          </UiButton>
        </div>
      </article>
    </UiPanel>

    <GroupStatus
      v-for="group in dashboard.data?.groups ?? []"
      :key="group.id"
      :group="group"
      :current-user-id="auth.user?.id ?? ''"
    />

    <p v-if="!dashboard.data?.groups.length" class="text-vanilla-100">
      {{ $t('group-empty') }}
    </p>

    <p v-if="connectivity.unreachable" class="text-vanilla-100">
      {{ $t('group-stats-offline') }}
    </p>

    <UiPanel
      as="form"
      class="grid gap-3 md:grid-cols-[1fr_auto]"
      @submit.prevent="create"
    >
      <UiInput
        v-model="groupName"
        :placeholder="$t('group-name')"
        :disabled="connectivity.unreachable"
        required
      />
      <UiButton type="submit" :disabled="connectivity.unreachable">
        {{ $t('group-create') }}
      </UiButton>
    </UiPanel>

    <UiPanel
      v-if="primaryGroup"
      as="form"
      class="grid gap-3 md:grid-cols-[1fr_auto_auto]"
      @submit.prevent="invite"
    >
      <UiInput
        v-model="inviteLogin"
        :placeholder="$t('group-invite-login')"
        :disabled="connectivity.unreachable"
        required
      />
      <UiButton
        type="submit"
        variant="outline"
        :disabled="connectivity.unreachable"
      >
        {{ $t('group-invite') }}
      </UiButton>
      <UiButton
        variant="outline"
        :disabled="connectivity.unreachable"
        @click="leave"
      >
        {{ $t('group-leave') }}
      </UiButton>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api } from '@/api/client';
import GroupStatus from '@/components/GroupStatus.vue';
import LatinTerm from '@/components/LatinTerm.vue';
import UiButton from '@/components/UiButton.vue';
import UiInput from '@/components/UiInput.vue';
import UiPanel from '@/components/UiPanel.vue';
import { useAuthStore } from '@/stores/auth';
import { useConnectivityStore } from '@/stores/connectivity';
import { useDashboardStore } from '@/stores/dashboard';

const auth = useAuthStore();
const connectivity = useConnectivityStore();
const dashboard = useDashboardStore();
const groupName = ref('');
const inviteLogin = ref('');
const primaryGroup = computed(() => dashboard.data?.groups[0] ?? null);

async function create(): Promise<void> {
  if (connectivity.unreachable) {
    return;
  }
  await api.createGroup(groupName.value.trim());
  groupName.value = '';
  await dashboard.refresh();
}

async function invite(): Promise<void> {
  if (!primaryGroup.value || connectivity.unreachable) {
    return;
  }
  await api.invite(primaryGroup.value.id, inviteLogin.value.trim());
  inviteLogin.value = '';
}

async function accept(id: string): Promise<void> {
  if (connectivity.unreachable) {
    return;
  }
  await api.acceptInvitation(id);
  await dashboard.refresh();
}

async function decline(id: string): Promise<void> {
  if (connectivity.unreachable) {
    return;
  }
  await api.declineInvitation(id);
  await dashboard.refresh();
}

async function leave(): Promise<void> {
  if (!primaryGroup.value || connectivity.unreachable) {
    return;
  }
  await api.leaveGroup(primaryGroup.value.id);
  await dashboard.refresh();
}

onMounted(() => {
  if (!dashboard.data) {
    void dashboard.refresh();
  }
});
</script>
