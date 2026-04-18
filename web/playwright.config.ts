import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  reporter: 'list',
  webServer: {
    command: 'npm run dev',
    port: 3099,
    reuseExistingServer: true,
    timeout: 60_000,
  },
  use: {
    baseURL: 'http://localhost:3099',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'seed',
      testMatch: /_seed-auth\.spec\.ts/,
      timeout: 5 * 60_000,
      use: {
        browserName: 'chromium',
        headless: false,
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'chromium',
      testIgnore: /_seed-auth\.spec\.ts/,
      use: { browserName: 'chromium' },
    },
    {
      name: 'authed',
      testMatch: /\.authed\.spec\.ts/,
      use: {
        browserName: 'chromium',
        storageState: 'e2e/.auth/github.json',
      },
    },
  ],
});
