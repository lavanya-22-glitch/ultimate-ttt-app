import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/start': 'http://localhost:5000',
      '/move': 'http://localhost:5000',
      '/state': 'http://localhost:5000',
    },
  },
});
