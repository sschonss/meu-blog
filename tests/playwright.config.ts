import { defineConfig, devices } from '@playwright/test';

// Smoke tests do site gerado. O site é construído antes com:
//   hugo --minify --baseURL http://127.0.0.1:4173/ --destination tests/.site
// e servido aqui por http-server (que devolve 404.html para páginas que não existem).
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  timeout: 20_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx http-server .site -p ${PORT} -a 127.0.0.1 -s -c-1`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
