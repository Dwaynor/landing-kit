import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4321',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'light',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'light',
      },
    },
    {
      name: 'dark',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 14'],
        colorScheme: 'light',
      },
    },
  ],
});
