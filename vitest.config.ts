import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  resolve: { conditions: ['browser'] },
  define: { __APP_VERSION__: JSON.stringify('test') },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
