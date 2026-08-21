import type { ReactNode } from 'react';
import { MobileTabBar } from '@/components/mobile-tab-bar';
import { Sidebar } from '@/components/sidebar';
import type { SpaceRow } from '@/lib/types';

/**
 * Il guscio: sidebar (240px) + colonna centrale su desktop, colonna singola
 * con tab bar in basso su mobile (docs/03 §4). È un componente SERVER: al
 * browser non arriva JavaScript per disegnarlo.
 */
export function AppShell({
  spaces,
  inbox,
  children,
}: {
  spaces: SpaceRow[];
  inbox: number;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-bg">
      <Sidebar spaces={spaces} inbox={inbox} />
      <main className="min-w-0 flex-1 px-5 pt-6 pb-24 lg:px-10 lg:pt-10 lg:pb-10">{children}</main>
      <MobileTabBar />
    </div>
  );
}
