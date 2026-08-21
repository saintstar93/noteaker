-- =====================================================================
-- 003 — Storage per le immagini delle note
--
-- Supabase Storage è Postgres anche lui: i file stanno su disco, ma i
-- METADATI stanno nella tabella `storage.objects`, e su quella tabella
-- valgono le policy RLS come su ogni altra. Quindi la sicurezza dei file
-- si scrive nello stesso modo della sicurezza delle righe.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'note-media',
  'note-media',
  -- PRIVATO. Un bucket pubblico è leggibile da chiunque conosca (o indovini)
  -- l'URL: per le immagini dentro le note personali di Daniele non va bene.
  -- Le immagini si servono con URL firmati a scadenza, generati al volo.
  false,
  20971520,   -- 20 MB per file
  array[
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/avif'
    -- NIENTE image/svg+xml di proposito: un SVG è un documento XML che può
    -- contenere <script>. Servito dal nostro dominio sarebbe XSS
    -- (docs/06-sicurezza.md §3.6). Se un giorno servisse, va sanificato prima.
  ]
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Convenzione sui percorsi: <user_id>/<item_id>/<nome-file>
--
-- La prima cartella del percorso è l'id dell'utente, e le policy qui sotto
-- controllano esattamente quella. `storage.foldername(name)` spezza il
-- percorso in un array: `[1]` è la prima cartella (gli array in Postgres
-- partono da 1, non da 0).
-- ---------------------------------------------------------------------

create policy "note-media: leggi i tuoi file"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'note-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "note-media: carica nella tua cartella"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'note-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "note-media: cancella i tuoi file"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'note-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
