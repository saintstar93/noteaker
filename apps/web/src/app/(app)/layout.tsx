import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { DEMO_SPACES } from '@/lib/demo';

/**
 * Layout del gruppo "(app)": le parentesi nel nome della cartella creano un
 * gruppo di rotte — condividono questo layout senza aggiungere un segmento
 * all'URL. `/inbox` resta `/inbox`, non `/app/inbox`.
 *
 * TODO (fase 1): gli Space arrivano da Supabase, non da DEMO_SPACES.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell spaces={DEMO_SPACES}>{children}</AppShell>;
}
