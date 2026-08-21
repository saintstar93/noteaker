import { EmptyState } from '@/components/empty-state';
import { TitoloSchermata } from '@/components/ui';
import { getGoals, getHabitLogs, getHabits } from '@/lib/queries';
import { ListaAbitudini } from './lista-abitudini';
import { NuovaAbitudine } from './nuova-abitudine';

export const dynamic = 'force-dynamic';

export default async function AbitudiniPage() {
  const [habits, logs, goals] = await Promise.all([getHabits(), getHabitLogs(), getGoals()]);

  // Le Map non attraversano il confine server → client (non sono
  // serializzabili in JSON), quindi si passa un oggetto di array.
  const logsSerializzabili = Object.fromEntries(
    [...logs.entries()].map(([habitId, giorni]) => [habitId, [...giorni]]),
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <TitoloSchermata sopra="Quello che ripeti">Abitudini</TitoloSchermata>

      <NuovaAbitudine goals={goals} />

      {habits.length === 0 ? (
        <EmptyState
          title="Nessuna abitudine ancora"
          description="Un'abitudine è una cosa che si ripete e che porta verso un obiettivo. Creane una qui sopra: scegli i giorni, poi segnala fatta con un tocco. La streak si calcola da sola."
        />
      ) : (
        <ListaAbitudini habits={habits} logs={logsSerializzabili} />
      )}
    </div>
  );
}
