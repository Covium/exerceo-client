import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
      },
      manifest: {
        name: 'Exerceo',
        short_name: 'Exerceo',
        description: 'Private exercise tracking',
        theme_color: '#090911',
        background_color: '#090911',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure(proxy) {
          proxy.on('error', (_error, _request, response) => {
            if (
              response &&
              'headersSent' in response &&
              !response.headersSent &&
              'writeHead' in response &&
              typeof response.writeHead === 'function'
            ) {
              response.writeHead(503, { 'Content-Type': 'application/json' });
              response.end(JSON.stringify({ message: 'error-network' }));
            }
          });
        },
      },
    },
  },
});
