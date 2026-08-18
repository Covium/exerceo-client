<template>
  <UiPanel>
    <p class="font-display text-gold-400 tracking-display-wide">
      <LatinTerm id="coetus" />
    </p>
    <p v-if="offline" class="text-vanilla-100 mt-3 text-sm">
      {{ $t('group-stats-offline') }}
    </p>
    <p v-if="offline" class="text-vanilla-50/90 mt-2 text-sm">
      {{ memberNames }}
    </p>
    <div v-else class="-mx-2 mt-4 overflow-x-auto">
      <table
        class="min-w-full border-separate border-spacing-x-2 text-left text-sm"
      >
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
            <td class="text-vanilla-100 py-1">{{ $t('group-streak') }}</td>
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

const props = defineProps<{
  group: GroupStatus;
  currentUserId: string;
}>();

const { $t } = useFluent();
const connectivity = useConnectivityStore();
const offline = computed(() => connectivity.unreachable);

function labelFor(member: GroupMemberStatus): string {
  return member.userId === props.currentUserId
    ? $t('group-you')
    : member.displayName;
}

const memberNames = computed(() =>
  props.group.members.map((member) => labelFor(member)).join(' · '),
);
</script>
