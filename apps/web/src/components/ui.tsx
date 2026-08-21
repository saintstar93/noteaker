import { cn } from '@noteaker/ui/cn';
import type { ComponentProps, ReactNode } from 'react';

/**
 * I primitivi dell'interfaccia. Non sono shadcn/ui: shadcn serve quando
 * arrivano dialog, dropdown e command palette, dove l'accessibilità da
 * tastiera è lavoro vero (fase 2). Finché i componenti sono un bottone e un
 * campo di testo, copiare qui le classi è più onesto che aggiungere Radix.
 *
 * Nessun colore hardcodato: solo token (docs/03-design-system.md §2).
 */

const BASE_BOTTONE =
  'inline-flex min-h-9 items-center justify-center gap-2 rounded-sm px-3 text-[13px] font-medium transition-colors duration-[120ms] ease-out disabled:opacity-50';

const VARIANTI = {
  primario: 'bg-yellow text-on-accent hover:brightness-110',
  neutro: 'bg-surface-2 text-fg hover:bg-surface-3',
  fantasma: 'text-fg-muted hover:bg-surface-2 hover:text-fg',
  pericolo: 'text-fg-muted hover:bg-danger hover:text-on-accent',
} as const;

export function Bottone({
  variante = 'neutro',
  className,
  ...props
}: ComponentProps<'button'> & { variante?: keyof typeof VARIANTI }) {
  return <button className={cn(BASE_BOTTONE, VARIANTI[variante], className)} {...props} />;
}

export function Campo({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        // 16px sotto iOS: sotto questa soglia Safari zooma sul campo
        'min-h-9 w-full rounded-sm bg-surface-2 px-3 text-[16px] placeholder:text-fg-subtle lg:text-[14px]',
        className,
      )}
      {...props}
    />
  );
}

export function AreaTesto({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-sm bg-surface-2 p-3 text-[16px] leading-relaxed placeholder:text-fg-subtle lg:text-[15px]',
        className,
      )}
      {...props}
    />
  );
}

export function Tendina({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'min-h-9 rounded-sm bg-surface-2 px-3 text-[14px] text-fg [&>option]:bg-surface-2',
        className,
      )}
      {...props}
    />
  );
}

export function Etichetta({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('label text-fg-subtle', className)}>{children}</p>;
}

/** Il titolo grande. Una volta sola per schermata, in cima (docs/03 §3). */
export function TitoloSchermata({ children, sopra }: { children: ReactNode; sopra?: string }) {
  return (
    <header className="flex flex-col gap-1">
      {sopra ? <Etichetta>{sopra}</Etichetta> : null}
      <h1 className="font-display font-extrabold text-[34px] leading-[1.05] tracking-[-0.02em] lg:text-[44px]">
        {children}
      </h1>
    </header>
  );
}

export function Pannello({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('rounded-lg bg-surface-2 p-4', className)}>{children}</section>;
}
