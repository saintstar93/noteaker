import { Etichetta, Pannello, TitoloSchermata } from '@/components/ui';
import { getCaptureEvents, getCaptureTokens, getPomodoroSettings } from '@/lib/queries';
import { GestioneToken, RegistroCatture } from './gestione-token';
import { ImpostazioniPomodoro } from './impostazioni-pomodoro';

export const dynamic = 'force-dynamic';

export default async function ImpostazioniPage() {
  const [tokens, eventi, pomodoro] = await Promise.all([
    getCaptureTokens(),
    getCaptureEvents(),
    getPomodoroSettings(),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <TitoloSchermata sopra="Impostazioni">Preferenze</TitoloSchermata>

      <section className="flex flex-col gap-3">
        <Etichetta>Pomodoro</Etichetta>
        {pomodoro ? <ImpostazioniPomodoro impostazioni={pomodoro} /> : null}
      </section>

      <p className="max-w-[68ch] text-[13px] text-fg-muted">
        Ogni fonte che salva dentro Noteaker — l'estensione di Chrome, lo Shortcut dell'iPhone, il
        bot Telegram — usa un proprio token. Sono la chiave dell'unica porta dell'app aperta su
        internet senza login: trattali come password.
      </p>

      <section className="flex flex-col gap-3">
        <Etichetta>Token</Etichetta>
        <GestioneToken tokens={tokens} />
      </section>

      <section className="flex flex-col gap-3">
        <Etichetta>Ultime chiamate</Etichetta>
        <Pannello>
          <RegistroCatture eventi={eventi} />
        </Pannello>
      </section>
    </div>
  );
}
