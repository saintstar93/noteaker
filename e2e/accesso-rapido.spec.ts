import { expect, test } from '@playwright/test';

/**
 * L'accesso rapido di sviluppo. Due cose da verificare, e la seconda conta
 * più della prima: che funzioni, e che sia **impossibile** in produzione.
 */

test('entra senza passare da Mailpit', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByText('solo in locale')).toBeVisible();
  await page.getByRole('button', { name: /Entra come Daniele/ }).click();

  // Si atterra in Today, con gli Space creati dal seed
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: /che contano oggi/ })).toBeVisible();
  await expect(page.locator('nav').getByText('Corsi')).toBeVisible();
});

test('l’utente di sviluppo sopravvive a un db reset', async ({ page, context }) => {
  // Entra, esce cancellando i cookie, rientra: è il caso che si verifica
  // dopo ogni `supabase db reset`.
  await page.goto('/login');
  await page.getByRole('button', { name: /Entra come Daniele/ }).click();
  await expect(page).toHaveURL('/');

  await context.clearCookies();

  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
  await page.getByRole('button', { name: /Entra come Daniele/ }).click();
  await expect(page).toHaveURL('/');
});
