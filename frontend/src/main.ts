import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '@/App.vue';
import router from '@/router';
import { fluent } from '@/i18n/fluent';
import { useAuthStore } from '@/stores/auth';
import { useConnectivityStore } from '@/stores/connectivity';
import '@/style.css';

if (import.meta.env.VITE_ANDROID !== 'true') {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(fluent);

const connectivity = useConnectivityStore();
connectivity.bind();

const auth = useAuthStore();
void auth.hydrate().then(() => {
  app.mount('#app');
});
