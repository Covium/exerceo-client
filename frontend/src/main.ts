import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '@/App.vue';
import router from '@/router';
import { fluent } from '@/i18n/fluent';
import { useAuthStore } from '@/stores/auth';
import { useConnectivityStore } from '@/stores/connectivity';
import { registerSW } from 'virtual:pwa-register';
import '@/style.css';

registerSW({ immediate: true });

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
