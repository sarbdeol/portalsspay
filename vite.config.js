import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          data: ['@tanstack/react-query', 'axios', 'zustand'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          ui: ['@headlessui/react', 'lucide-react'],
        },
      },
    },
  },
});
