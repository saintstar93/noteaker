'use client';

import { cn } from '@noteaker/ui/cn';
import {
  CheckSquare,
  FolderKanban,
  FolderTree,
  Inbox,
  Repeat,
  Search,
  Settings,
  Sun,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SPACE_BG } from '@/lib/colors';
import type { SpaceRow } from '@/lib/types';

/**
 * Componente CLIENT: gli serve `usePathname()` per sapere quale voce
 * evidenziare, e quello è un hook del browser. Gli spaces però arrivano già
 * pronti dal server come props: il browser non interroga il database.
 */

const NAV = [
  { href: '/', label: 'Today', icon: Sun },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/task', label: 'Task', icon: CheckSquare },
  { href: '/progetti', label: 'Progetti', icon: FolderKanban },
  { href: '/abitudini', label: 'Abitudini', icon: Repeat },
  { href: '/obiettivi', label: 'Obiettivi', icon: Target },
  { href: '/spaces', label: 'Spaces', icon: FolderTree },
  { href: '/cerca', label: 'Cerca', icon: Search },
  { href: '/impostazioni', label: 'Impostazioni', icon: Settings },
] as const;

export function Sidebar({ spaces, inbox }: { spaces: SpaceRow[]; inbox: number }) {
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
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
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
                {href === '/inbox' && inbox > 0 ? (
                  <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-fg-muted">
                    {inbox}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>

      {spaces.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="label px-3 text-fg-subtle">Spaces</p>
          <ul className="flex flex-col gap-0.5">
            {spaces.map((space) => (
              <li key={space.id}>
                <Link
                  href={`/spaces/${space.id}`}
                  className="flex items-center gap-3 rounded-sm px-3 py-2 text-[13px] text-fg-muted hover:bg-surface-2 hover:text-fg"
                >
                  {/* Il colore non è mai l'unica informazione: accanto c'è il nome. */}
                  <span
                    aria-hidden
                    className={cn(
                      'size-2 rounded-full',
                      SPACE_BG[(space.color ?? 'yellow') as keyof typeof SPACE_BG],
                    )}
                  />
                  <span className="flex-1 truncate">{space.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </nav>
  );
}
