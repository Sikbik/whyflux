import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// The dev server defaults to 5190 so it never collides with Flux Academy (5180) or Atlas.
// Override with WEB_PORT.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '127.0.0.1',
      port: Number(env.WEB_PORT || 5190),
      strictPort: true,
    },
    preview: {
      host: '127.0.0.1',
      port: Number(env.WEB_PORT || 4190),
    },
  };
});
