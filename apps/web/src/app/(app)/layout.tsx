import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { contaInbox, getSpaces } from '@/lib/queries';

/**
 * Layout del gruppo "(app)": le parentesi nel nome della cartella creano un
 * gruppo di rotte — condividono questo layout senza aggiungere un segmento
 * all'URL. `/inbox` resta `/inbox`, non `/app/inbox`.
 *
 * Le due query girano qui una volta sola e valgono per tutte le pagine dentro.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const [spaces, inbox] = await Promise.all([getSpaces(), contaInbox()]);

  return (
    <AppShell spaces={spaces} inbox={inbox}>
      {children}
    </AppShell>
  );
}
