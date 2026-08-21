import type { SpaceColor } from '@noteaker/core';
import { cn } from '@noteaker/ui/cn';
import type { ReactNode } from 'react';
import { SPACE_BG } from '@/lib/colors';

/**
 * La card colorata è il mattone del design system (docs/03 §5).
 * Testo sempre scuro sopra il colore: bianco su viola o rosso non passa il
 * contrasto 4.5:1, e l'accessibilità qui non è negoziabile.
 */
export function ColoredCard({
  color,
  label,
  children,
  className,
}: {
  color: SpaceColor;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'flex flex-col gap-3 rounded-lg p-5 text-on-accent',
        'transition-transform duration-[120ms] ease-out hover:scale-[1.01]',
        SPACE_BG[color],
        className,
      )}
    >
      <p className="label opacity-70">{label}</p>
      {children}
    </section>
  );
}

/** Variante neutra, per quando il colore non significherebbe niente. */
export function SurfaceCard({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex flex-col gap-3 rounded-lg bg-surface-2 p-5', className)}>
      <p className="label text-fg-subtle">{label}</p>
      {children}
    </section>
  );
}
