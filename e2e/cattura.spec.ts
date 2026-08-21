import { expect, test } from '@playwright/test';
import { admin, entraNellApp } from './sessione';

/**
 * Il giro completo della cattura, come lo farà Daniele:
 * crea il token dall'interfaccia, lo usa da fuori, ritrova la cosa in Inbox.
 */

let userId: string;

test.beforeEach(async ({ context }) => {
  const s = await entraNellApp(context);
  userId = s.userId;
});

test.afterEach(async () => {
  if (userId) await admin.auth.admin.deleteUser(userId);
});

test('creo un token, catturo da fuori, lo ritrovo in Inbox', async ({ page }) => {
  await page.goto('/impostazioni');

  await page.getByPlaceholder('Nome della fonte').fill('Chrome');
  await page.getByRole('button', { name: 'Crea token' }).click();

  // Il token si vede UNA volta sola, in chiaro
  const riquadro = page.locator('code').first();
  await expect(riquadro).toBeVisible();
  const token = (await riquadro.textContent())?.trim() ?? '';
  expect(token).toMatch(/^ntk_[0-9a-f]{64}$/);

  // Usato da fuori, come farebbe l'estensione
  const risposta = await page.request.post('/api/capture', {
    headers: { authorization: `Bearer ${token}` },
    data: { url: 'https://www.example.com/guida', title: 'Una guida', source: 'extension' },
  });
  expect(risposta.status()).toBe(202);

  // E si ritrova in Inbox
  await page.goto('/inbox');
  await expect(page.getByText('Una guida')).toBeVisible();
  await expect(page.getByText('example.com')).toBeVisible();
});

test('il token appare una volta sola: ricaricando resta solo l’indizio', async ({ page }) => {
  await page.goto('/impostazioni');
  await page.getByPlaceholder('Nome della fonte').fill('iPhone');
  await page.getByRole('button', { name: 'Crea token' }).click();

  const token = (await page.locator('code').first().textContent())?.trim() ?? '';

  await page.reload();
  await expect(page.getByText('iPhone', { exact: true })).toBeVisible();
  // Il valore in chiaro non deve più comparire da nessuna parte nella pagina
  expect(await page.content()).not.toContain(token);
});

test('un token revocato smette di funzionare subito', async ({ page }) => {
  await page.goto('/impostazioni');
  await page.getByPlaceholder('Nome della fonte').fill('Telegram');
  await page.getByRole('button', { name: 'Crea token' }).click();
  const token = (await page.locator('code').first().textContent())?.trim() ?? '';

  const prima = await page.request.post('/api/capture', {
    headers: { authorization: `Bearer ${token}` },
    data: { text: 'un pensiero', source: 'telegram' },
  });
  expect(prima.status()).toBe(202);

  await page.getByRole('button', { name: 'Revoca "Telegram"' }).click();

  // Si aspetta che l'interfaccia confermi la revoca: il clic parte subito, la
  // scrittura sul database no. Senza questa attesa il test farebbe la seconda
  // chiamata prima che la revoca sia registrata, e accuserebbe l'app di un
  // buco che non ha.
  await expect(page.getByText('— revocato')).toBeVisible();

  const dopo = await page.request.post('/api/capture', {
    headers: { authorization: `Bearer ${token}` },
    data: { text: 'un altro pensiero', source: 'telegram' },
  });
  expect(dopo.status()).toBe(401);
});
