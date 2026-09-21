import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: true,
      // Same-origin proxy: the web app calls /api/v1 on its own origin, so
      // CORS and cross-origin cookies never come into play (works from
      // localhost or the LAN address, any device). The Origin header is
      // stripped — the API treats the request as same-origin.
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin');
            });
          },
        },
      },
    },
  };
});
