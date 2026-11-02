import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  timeout: 45_000,
  expect: {timeout: 12_000},
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173/game-rotations/',
    browserName: 'chromium',
    viewport: {width:390,height:844},
    deviceScaleFactor:2,
    isMobile:true,
    hasTouch:true,
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
  },
  webServer: {
    command:'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url:'http://127.0.0.1:4173/game-rotations/',
    reuseExistingServer:!process.env.CI,
    timeout:30_000,
  },
});