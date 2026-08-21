-- =====================================================================
-- SEED — dati di comodo per lo sviluppo LOCALE
--
-- Girano solo con `supabase db reset` sullo stack locale. Non finiscono
-- MAI in produzione: il progetto cloud applica le migrazioni, non questo
-- file.
--
-- Perché esiste: ogni `db reset` cancella tutti gli utenti, e rifare il
-- giro del magic link su Mailpit a ogni giro è una tassa inutile. Qui si
-- ricrea sempre lo stesso utente, con la stessa password, così il
-- pulsante di accesso rapido sulla pagina di login funziona subito.
-- =====================================================================

do $$
declare
  id_utente uuid := '11111111-1111-1111-1111-111111111111';
begin
  -- L'utente di sviluppo.
  -- `crypt(..., gen_salt('bf'))` è bcrypt: la password non viene salvata
  -- in chiaro nemmeno qui, perché GoTrue si aspetta un'impronta.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin,
    -- GoTrue legge queste colonne come stringhe, non come testo opzionale:
    -- lasciarle NULL fa fallire il login con
    -- "converting NULL to string is unsupported". Vanno messe vuote.
    confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, reauthentication_token
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    id_utente,
    'authenticated',
    'authenticated',
    'daniele@noteaker.local',
    extensions.crypt('noteaker', extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Daniele"}'::jsonb,
    false,
    '', '', '', '', '', ''
  )
  on conflict (id) do nothing;

  -- GoTrue moderno non accetta il login con password se manca la riga
  -- corrispondente in `auth.identities`: l'utente esisterebbe ma non
  -- riuscirebbe a entrare.
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  )
  values (
    gen_random_uuid(),
    id_utente,
    id_utente::text,
    format('{"sub":"%s","email":"%s","email_verified":true}', id_utente, 'daniele@noteaker.local')::jsonb,
    'email',
    now(), now(), now()
  )
  on conflict (provider_id, provider) do nothing;

  -- Qualche Space, così dopo un reset l'app non è un deserto.
  insert into public.spaces (user_id, name, color, position) values
    (id_utente, 'Business',  'yellow', 0),
    (id_utente, 'Fitness',   'green',  1),
    (id_utente, 'Corsi',     'purple', 2),
    (id_utente, 'Personale', 'blue',   3)
  on conflict do nothing;
end $$;
