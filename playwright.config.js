import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_FIREBASE_API_KEY: 'demo-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'demo-taskify.firebaseapp.com',
      VITE_FIREBASE_DATABASE_URL: 'https://demo-taskify-default-rtdb.firebaseio.com',
      VITE_FIREBASE_PROJECT_ID: 'demo-taskify',
      VITE_FIREBASE_APP_ID: '1:000000000000:web:000000000000000000000000',
      VITE_USE_FIREBASE_EMULATORS: 'true',
    },
  },
});