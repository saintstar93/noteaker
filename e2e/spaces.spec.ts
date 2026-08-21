import { expect, test } from '@playwright/test';
import { admin, entraNellApp } from './sessione';

/** I comandi degli Space: rinomina ed elimina, provati nel browser. */

let userId: string;
let supabase: Awaited<ReturnType<typeof entraNellApp>>['supabase'];

test.beforeEach(async ({ context }) => {
  const s = await entraNellApp(context);
  userId = s.userId;
  supabase = s.supabase;
});

test.afterEach(async () => {
  if (userId) await admin.auth.admin.deleteUser(userId);
});

test('si può rinominare uno space e cambiargli colore', async ({ page }) => {
  await supabase.from('spaces').insert({ name: 'Corsi', color: 'yellow' });

  await page.goto('/spaces');
  await page.getByRole('button', { name: 'Rinomina "Corsi"' }).click();

  // Il form di rinomina, non quello di creazione: l'etichetta "Colore" esiste
  // in tutti e due.
  const form = page.locator('form:has([aria-label="Nome dello space"])');
  await form.getByLabel('Nome dello space').fill('Formazione');
  await form.getByLabel('Colore').selectOption('teal');
  await form.getByRole('button', { name: 'Salva' }).click();

  await expect(page.locator('main').getByText('Formazione')).toBeVisible();

  const { data } = await supabase.from('spaces').select('name, color').single();
  expect(data).toEqual({ name: 'Formazione', color: 'teal' });
});

test('eliminare uno space non cancella le note: tornano in Inbox', async ({ page }) => {
  const { data: space } = await supabase
    .from('spaces')
    .insert({ name: 'Da buttare' })
    .select()
    .single();
  const { data: cartella } = await supabase
    .from('collections')
    .insert({ space_id: space.id, name: 'Dentro', path: 'x' })
    .select()
    .single();
  await supabase.from('items').insert({
    title: 'Nota preziosa',
    kind: 'note',
    status: 'active',
    collection_id: cartella.id,
  });

  await page.goto('/spaces');
  await page.getByRole('button', { name: 'Elimina "Da buttare"' }).click();

  // La conferma deve dire cosa succede, non un generico "sei sicuro?"
  await expect(page.getByText('tornano in Inbox')).toBeVisible();
  await page.getByRole('button', { name: 'Sì, elimina' }).click();

  await expect(page.getByText('Nessuno space')).toBeVisible();

  const { data: spaceRimasti } = await supabase.from('spaces').select('id');
  expect(spaceRimasti).toEqual([]);

  const { data: nota } = await supabase
    .from('items')
    .select('title, status, collection_id')
    .single();
  expect(nota?.title).toBe('Nota preziosa');
  expect(nota?.status).toBe('inbox');
  expect(nota?.collection_id).toBeNull();
});

test('si può annullare l’eliminazione', async ({ page }) => {
  await supabase.from('spaces').insert({ name: 'Resta' });

  await page.goto('/spaces');
  await page.getByRole('button', { name: 'Elimina "Resta"' }).click();
  await page.getByRole('button', { name: 'Annulla' }).click();

  // `main`, non tutta la pagina: il nome compare anche nella sidebar.
  await expect(page.locator('main').getByText('Resta')).toBeVisible();
  const { data } = await supabase.from('spaces').select('id');
  expect(data).toHaveLength(1);
});
