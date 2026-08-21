'use client';

import type { Space } from '@noteaker/core';
import { cn } from '@noteaker/ui/cn';
import { Inbox, Library, Repeat, Search, Sun, Target } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SPACE_BG } from '@/lib/colors';

/**
 * Componente CLIENT: gli serve `usePathname()` per sapere quale voce
 * evidenziare, e quello è un hook del browser. Tutto il resto dell'app
 * resta server-side.
 */

const NAV = [
  { href: '/', label: 'Today', icon: Sun },
  { href: '/inbox', label: 'Inbox', icon: Inbox, badge: 3 },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/cerca', label: 'Cerca', icon: Search },
] as const;

export function Sidebar({ spaces }: { spaces: Space[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigazione principale"
      className="hidden w-60 shrink-0 flex-col gap-6 bg-surface p-4 lg:flex"
    >
      <Link href="/" className="px-2 py-1 font-display text-lg font-extrabold tracking-tight">
        Noteaker
      </Link>

      <ul className="flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon, ...rest }) => {
          const active = pathname === href;
          const badge = 'badge' in rest ? rest.badge : undefined;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-sm px-3 py-2 text-[13px] transition-colors duration-[120ms] ease-out',
                  active
                    ? 'bg-surface-3 text-fg'
                    : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                )}
              >
                <Icon aria-hidden size={16} strokeWidth={2} />
                <span className="flex-1">{label}</span>
                {badge ? (
                  <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-fg-muted">
                    {badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-2">
        <p className="label px-3 text-fg-subtle">Spaces</p>
        <ul className="flex flex-col gap-0.5">
          {spaces.map((space) => (
            <li
              key={space.id}
              className="flex items-center gap-3 rounded-sm px-3 py-2 text-[13px] text-fg-muted"
            >
              {/* Il colore non è mai l'unica informazione: accanto c'è il nome. */}
              <span aria-hidden className={cn('size-2 rounded-full', SPACE_BG[space.color])} />
              <span className="flex-1">{space.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex flex-col gap-0.5 text-[13px] text-fg-subtle">
        <span className="flex items-center gap-3 px-3 py-2">
          <Target aria-hidden size={16} /> Goals
          <span className="label ml-auto text-fg-subtle">fase 4</span>
        </span>
        <span className="flex items-center gap-3 px-3 py-2">
          <Repeat aria-hidden size={16} /> Habits
          <span className="label ml-auto text-fg-subtle">fase 4</span>
        </span>
      </div>
    </nav>
  );
}
