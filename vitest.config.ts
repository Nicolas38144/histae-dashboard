import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_ENV__: JSON.stringify('test'),
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost/api'),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['./tests/{unit,components}/**/*.spec.{ts,tsx}'],
    pool: 'threads',
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 20_000,
    clearMocks: true,
    restoreMocks: true,
  },
});
