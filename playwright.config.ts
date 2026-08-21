import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright guida un browser VERO. Serve per le poche cose che non si possono
 * verificare in nessun altro modo: qui l'editor a blocchi, che esiste solo nel
 * browser (ProseMirror ha bisogno del DOM) e che quindi né la build né una
 * richiesta HTTP possono mettere alla prova.
 *
 * Presuppone `supabase start` e `pnpm dev` già attivi: non li avvia lui, per
 * non spegnere per sbaglio l'ambiente su cui stai lavorando.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3100',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
