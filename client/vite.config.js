// Purpose: Vite config with a dev proxy so the React app can call /api on the Express server.
// Portions of this file were generated with AI assistance (Cursor) and reviewed by the author.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
});
