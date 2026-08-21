import type { Space } from '@noteaker/core';
import type { ReactNode } from 'react';
import { MobileTabBar } from '@/components/mobile-tab-bar';
import { Sidebar } from '@/components/sidebar';

/**
 * Il guscio dell'app: sidebar (240px) + colonna centrale + pannello destro
 * (docs/03-design-system.md §4). È un componente SERVER: non ha stato, produce
 * HTML sul server, e al browser non arriva JavaScript per disegnarlo.
 * Sotto i 1024px sidebar e pannello spariscono e resta una colonna sola.
 */
export function AppShell({
  spaces,
  children,
  panel,
}: {
  spaces: Space[];
  children: ReactNode;
  panel?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-bg">
      <Sidebar spaces={spaces} />

      <main className="min-w-0 flex-1 px-5 pt-6 pb-24 lg:px-10 lg:pt-10 lg:pb-10">{children}</main>

      {panel ? (
        <aside
          aria-label="Contesto"
          className="hidden w-[340px] shrink-0 flex-col gap-4 bg-surface p-5 xl:flex"
        >
          {panel}
        </aside>
      ) : null}

      <MobileTabBar />
    </div>
  );
}
