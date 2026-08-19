<template>
  <UiPanel>
    <p v-if="showTerm" class="font-display text-gold-400 tracking-display-wide">
      <LatinTerm id="coetus" />
    </p>
    <p
      v-if="offline"
      class="text-vanilla-100 text-sm"
      :class="showTerm ? 'mt-3' : undefined"
    >
      {{ $t('group-stats-offline') }}
    </p>
    <div v-if="offline" class="mt-2 space-y-2">
      <p
        v-for="group in groups"
        :key="group.id"
        class="text-vanilla-50/90 text-sm"
      >
        <span class="font-display tracking-wide">{{ group.name }}</span>
        · {{ memberNames(group) }}
      </p>
    </div>
    <div v-else class="space-y-6" :class="showTerm ? 'mt-4' : undefined">
      <div
        v-for="group in groups"
        :key="group.id"
        class="-mx-2 overflow-x-auto"
      >
        <table
          class="min-w-full border-separate border-spacing-x-2 text-left text-sm"
        >
          <caption class="mb-3 caption-top px-2">
            <div
              class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
            >
              <p class="font-display text-gold-400 tracking-wide">
                {{ group.name }}
              </p>
              <p class="flex items-baseline gap-x-1">
                {{ $t('group-streak') }}:
                <RomanNumeral
                  class="text-base"
                  :value="group.groupStreak"
                  unit="weeks"
                />
              </p>
            </div>
          </caption>
          <thead class="text-vanilla-100">
            <tr>
              <th class="pb-2 font-medium" />
              <th
                v-for="member in group.members"
                :key="member.userId"
                class="pb-2 font-medium"
              >
                {{ labelFor(member) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-vanilla-100 py-1">{{ $t('group-today') }}</td>
              <td
                v-for="member in group.members"
                :key="`${member.userId}-today`"
                class="py-1"
              >
                {{ member.todayWorkedOut ? '✓' : '·' }}
              </td>
            </tr>
            <tr>
              <td class="text-vanilla-100 py-1">{{ $t('group-week') }}</td>
              <td
                v-for="member in group.members"
                :key="`${member.userId}-week`"
                class="py-1"
              >
                {{ member.weekQualifying }} / {{ member.weekTarget }}
              </td>
            </tr>
            <tr>
              <td class="text-vanilla-100 py-1">{{ $t('streak-weekly') }}</td>
              <td
                v-for="member in group.members"
                :key="`${member.userId}-streak`"
                class="font-display text-gold-400 py-1"
              >
                <RomanNumeral
                  :value="member.weeklyStreak"
                  unit="weeks"
                  class="tracking-inherit text-sm"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </UiPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFluent } from 'fluent-vue';
import type { GroupMemberStatus, GroupStatus } from '@/api/types';
import LatinTerm from '@/components/LatinTerm.vue';
import UiPanel from '@/components/UiPanel.vue';
import RomanNumeral from '@/components/RomanNumeral.vue';
import { useConnectivityStore } from '@/stores/connectivity';

const props = withDefaults(
  defineProps<{
    groups: GroupStatus[];
    currentUserId: string;
    showTerm?: boolean;
  }>(),
  { showTerm: true },
);

const { $t } = useFluent();
const connectivity = useConnectivityStore();
const offline = computed(() => connectivity.unreachable);

function labelFor(member: GroupMemberStatus): string {
  return member.userId === props.currentUserId
    ? $t('group-you')
    : member.displayName;
}

function memberNames(group: GroupStatus): string {
  return group.members.map((member) => labelFor(member)).join(' · ');
}
</script>
