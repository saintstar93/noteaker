import { expect, test } from '@playwright/test';
import { admin, entraNellApp } from './sessione';

/**
 * L'editor a blocchi, provato in un browser vero.
 *
 * Perché serve proprio qui: BlockNote gira SOLO nel browser (lo carichiamo con
 * `dynamic(..., { ssr: false })` perché ProseMirror ha bisogno del DOM). Né la
 * build né una richiesta HTTP possono dire se funziona: la pagina risponde 200
 * comunque, anche se l'editor non parte.
 */

let userId: string;
let notaId: string;

test.beforeEach(async ({ context }) => {
  const sessione = await entraNellApp(context);
  userId = sessione.userId;

  const { data: space } = await sessione.supabase
    .from('spaces')
    .insert({ name: 'Corsi', color: 'purple' })
    .select()
    .single();

  const { data: cartella } = await sessione.supabase
    .from('collections')
    .insert({ space_id: space.id, name: 'Meta Ads', path: 'segnaposto' })
    .select()
    .single();

  const { data: nota } = await sessione.supabase
    .from('items')
    .insert({ title: 'Lezione 3', kind: 'note', status: 'active', collection_id: cartella.id })
    .select()
    .single();

  notaId = nota.id;
});

test.afterEach(async () => {
  if (userId) await admin.auth.admin.deleteUser(userId);
});

test('scrivere testo e ritrovarlo dopo un ricaricamento', async ({ page }) => {
  await page.goto(`/note/${notaId}`);

  const editor = page.locator('.bn-editor');
  await expect(editor).toBeVisible();

  await editor.click();
  await page.keyboard.type('Il CPM sale il venerdì.');

  // L'indicatore passa da "Salvo…" a "Salvato": è il debounce da 800 ms
  await expect(page.getByText('Salvato')).toBeVisible();

  await page.reload();
  await expect(page.locator('.bn-editor')).toContainText('Il CPM sale il venerdì.');
});

test('gli indirizzi diventano link cliccabili mentre scrivi (autolink)', async ({ page }) => {
  await page.goto(`/note/${notaId}`);
  const editor = page.locator('.bn-editor');
  await expect(editor).toBeVisible();

  await editor.click();
  // Lo spazio finale è ciò che fa scattare il riconoscimento
  await page.keyboard.type('Fonte: https://www.blocknotejs.org ');

  const link = editor.locator('a[href="https://www.blocknotejs.org"]');
  await expect(link).toHaveCount(1);
});

test('inserire una tabella dal menu slash', async ({ page }) => {
  await page.goto(`/note/${notaId}`);
  const editor = page.locator('.bn-editor');
  await expect(editor).toBeVisible();

  await editor.click();
  await page.keyboard.type('/tabella');
  await page.keyboard.press('Enter');

  await expect(editor.locator('table')).toHaveCount(1);

  await expect(page.getByText('Salvato')).toBeVisible();
  await page.reload();
  await expect(page.locator('.bn-editor table')).toHaveCount(1);
});

test('inserire un blocco di codice dal menu slash', async ({ page }) => {
  await page.goto(`/note/${notaId}`);
  const editor = page.locator('.bn-editor');
  await expect(editor).toBeVisible();

  await editor.click();
  await page.keyboard.type('/codice');
  await page.keyboard.press('Enter');
  await page.keyboard.type('const roas = ricavi / spesa;');

  await expect(editor.locator('pre')).toHaveCount(1);
  await expect(editor.locator('pre')).toContainText('const roas');
});

test("caricare un'immagine la mette nello storage privato dell'utente", async ({ page }) => {
  await page.goto(`/note/${notaId}`);
  const editor = page.locator('.bn-editor');
  await expect(editor).toBeVisible();

  await editor.click();
  await page.keyboard.type('/immagine');
  await page.keyboard.press('Enter');

  // 1×1 px PNG trasparente: il file valido più piccolo possibile
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );

  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'prova.png',
    mimeType: 'image/png',
    buffer: png,
  });

  // L'immagine compare con un URL FIRMATO, generato al volo da resolveFileUrl:
  // dentro la nota resta salvato il percorso, non l'URL, così non scade mai.
  const immagine = editor.locator('img').first();
  await expect(immagine).toBeVisible();
  await expect(immagine).toHaveAttribute('src', /token=/);

  // e il file è finito davvero nella cartella dell'utente
  const { data } = await admin.storage.from('note-media').list(`${userId}/${notaId}`);
  expect(data?.length).toBeGreaterThan(0);
});
