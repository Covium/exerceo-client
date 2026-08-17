import { createRouter, createWebHistory } from 'vue-router';
import { getToken } from '@/api/client';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/enter',
      name: 'enter',
      component: () => import('@/views/EnterView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/components/AppShell.vue'),
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'history',
          name: 'history',
          component: () => import('@/views/HistoryView.vue'),
        },
        {
          path: 'measurements',
          name: 'measurements',
          component: () => import('@/views/MeasurementsView.vue'),
        },
        {
          path: 'groups',
          name: 'groups',
          component: () => import('@/views/GroupsView.vue'),
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/SettingsView.vue'),
        },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const publicRoute = Boolean(to.meta.public);
  const signedIn = Boolean(getToken());
  if (!publicRoute && !signedIn) {
    return { name: 'enter' };
  }
  if (publicRoute && signedIn && to.name === 'enter') {
    return { name: 'dashboard' };
  }
  return true;
});

export default router;
