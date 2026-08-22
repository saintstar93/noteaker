import { expect, test } from '@playwright/test';
import { admin, entraNellApp } from './sessione';

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

test('le task si raggruppano per progetto, e il progetto è facoltativo', async ({ page }) => {
  const { data: progetto } = await supabase
    .from('projects')
    .insert({ name: 'Rifare il sito', color: 'teal' })
    .select()
    .single();
  await supabase
    .from('tasks')
    .insert([
      { title: 'Comprare il dominio', project_id: progetto.id },
      { title: 'Una cosa qualsiasi' },
    ]);

  await page.goto('/task');
  await page.getByRole('button', { name: 'Lista' }).click();

  await expect(page.getByRole('heading', { name: 'Rifare il sito' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Senza progetto' })).toBeVisible();

  // Il filtro isola un progetto solo
  await page.getByLabel('Filtra per progetto').selectOption(progetto.id);
  await expect(page.getByText('Comprare il dominio')).toBeVisible();
  await expect(page.getByText('Una cosa qualsiasi')).toHaveCount(0);
});

test('posso creare una colonna mia e spostarci una task', async ({ page }) => {
  await supabase.from('tasks').insert({ title: 'Da consegnare' });

  await page.goto('/task');
  await page.getByRole('button', { name: 'Kanban' }).click();
  await page.getByRole('button', { name: 'Colonne' }).click();

  // "Aggiungi" c'è anche in fondo a ogni colonna: si restringe al form
  // del pannello di gestione.
  const pannello = page.locator('form:has([placeholder="Nuova colonna"])');
  await pannello.getByPlaceholder('Nuova colonna').fill('In revisione');
  await pannello.getByRole('button', { name: 'Aggiungi' }).click();

  await expect(page.getByRole('region', { name: 'Colonna In revisione' })).toBeVisible();

  // Sposta con la tendina (la via accessibile, equivalente al trascinamento)
  const { data: colonne } = await supabase.from('task_columns').select('*').order('position');
  const revisione = colonne?.find((c) => c.name === 'In revisione');
  expect(revisione, 'la colonna appena creata').toBeDefined();
  const idRevisione = revisione?.id ?? '';

  await page.getByLabel('Colonna di "Da consegnare"').selectOption(idRevisione);

  await expect(async () => {
    const { data } = await supabase.from('tasks').select('column_id').single();
    expect(data?.column_id).toBe(idRevisione);
  }).toPass();
});

test('una colonna marcata «finale» segna le task come fatte', async ({ page }) => {
  await supabase.from('tasks').insert({ title: 'Consegna' });

  await page.goto('/task');
  await page.getByRole('button', { name: 'Kanban' }).click();

  const { data: colonne } = await supabase.from('task_columns').select('*').order('position');
  const fatto = colonne?.find((c) => c.is_done);
  expect(fatto, 'la colonna marcata finale').toBeDefined();

  await page.getByLabel('Colonna di "Consegna"').selectOption(fatto?.id ?? '');

  await expect(async () => {
    const { data } = await supabase.from('tasks').select('status, completed_at').single();
    expect(data?.status).toBe('done');
    expect(data?.completed_at).not.toBeNull();
  }).toPass();
});

test('eliminare una colonna sposta le sue task invece di perderle', async ({ page }) => {
  await supabase.from('tasks').insert({ title: 'Non devo sparire' });

  await page.goto('/task');
  await page.getByRole('button', { name: 'Kanban' }).click();
  await page.getByRole('button', { name: 'Colonne' }).click();
  await page.getByRole('button', { name: 'Elimina la colonna "Da fare"' }).click();

  await expect(page.getByRole('region', { name: 'Colonna Da fare' })).toHaveCount(0);
  await expect(page.getByText('Non devo sparire')).toBeVisible();

  const { data } = await supabase.from('tasks').select('column_id').single();
  expect(data?.column_id).not.toBeNull();
});

test('il pomodoro parte, si mette in pausa e sopravvive al ricaricamento', async ({ page }) => {
  await page.goto('/task');

  const timer = page.getByRole('region', { name: 'Timer pomodoro' });
  await expect(timer).toContainText('25:00');

  await timer.getByRole('button', { name: 'Avvia' }).click();
  await expect(timer).not.toContainText('25:00');

  // Il conto si basa sull'orario di fine, non su un contatore: ricaricando
  // la pagina il tempo trascorso resta trascorso.
  await page.reload();
  await expect(timer).toContainText(/24:5\d/);

  await timer.getByRole('button', { name: 'Metti in pausa' }).click();
  const fermo = await timer.textContent();
  await page.waitForTimeout(1500);
  expect(await timer.textContent()).toBe(fermo);
});

test('le impostazioni del pomodoro valgono su tutti i dispositivi', async ({ page }) => {
  await page.goto('/impostazioni');

  await page.getByLabel('Concentrazione').fill('40');
  await page.getByRole('button', { name: 'Salva' }).click();

  // Il clic parte subito, la scrittura no: si aspetta il fatto.
  await expect(page.getByRole('button', { name: 'Salvato' })).toBeVisible();

  const { data } = await supabase.from('pomodoro_settings').select('work_minutes').single();
  expect(data?.work_minutes).toBe(40);

  // Sono in database, non in localStorage: un altro dispositivo le vede uguali
  await page.goto('/task');
  await expect(page.getByRole('region', { name: 'Timer pomodoro' })).toContainText('40:00');
});
