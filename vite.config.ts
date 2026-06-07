import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['vorak.app'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/')) {
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router/')) {
              return 'vendor-react';
            }
            if (id.includes('/axios/'))     return 'vendor-axios';
            if (id.includes('/jwt-decode/')) return 'vendor-jwt';
          }

          if (id.includes('/src/contexts/'))   return 'auth-context';
          if (id.includes('/src/services/'))   return 'services';

          if (id.includes('/src/shared/layouts/'))   return 'shared-layouts';
          if (id.includes('/src/shared/public/'))    return 'shared-auth';
        },
      },
    },
  },
})
