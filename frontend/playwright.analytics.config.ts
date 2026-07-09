import { defineConfig } from '@playwright/test';

process.env.VITE_AUTH_MODE = 'public';
process.env.VITE_API_BASE_URL = 'http://127.0.0.1:9999/api/v1';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5177',
    url: 'http://127.0.0.1:5177',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:5177',
    browserName: 'chromium',
  },
});
