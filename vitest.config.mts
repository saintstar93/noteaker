import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'packages/**/*.test.ts'],
    environment: 'node',
    /*
      I file di test girano UNO ALLA VOLTA.
      Quasi tutti creano utenti veri sullo stack Supabase locale, e GoTrue ha un
      limite di frequenza sulla creazione: in parallelo, ogni tanto qualcuno
      veniva respinto e il test falliva senza motivo apparente. Un test che
      fallisce a caso è peggio di un test lento, perché insegna a ignorare il
      rosso.
    */
    fileParallelism: false,
  },
});
