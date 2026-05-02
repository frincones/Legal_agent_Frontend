import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  workers: 2,
  reporter: [['list'], ['html', { outputFolder: 'tests/e2e/.report', open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://lexai-frontend-rho.vercel.app',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enable fake media for voice tests
        launchOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--autoplay-policy=no-user-gesture-required',
          ],
        },
        permissions: ['microphone'],
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
        permissions: ['microphone'],
      },
    },
  ],
});
