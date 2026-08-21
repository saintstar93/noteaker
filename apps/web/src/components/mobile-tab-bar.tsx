'use client';

import { cn } from '@noteaker/ui/cn';
import { Inbox, Library, Plus, Search, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Su mobile la navigazione è in basso, con target da almeno 44px (docs/03 §7). */
const TABS = [
  { href: '/', label: 'Today', icon: Sun },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/cerca', label: 'Cerca', icon: Search },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigazione"
      className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-border border-t bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px]',
              active ? 'text-fg' : 'text-fg-subtle',
            )}
          >
            <Icon aria-hidden size={20} />
            {label}
          </Link>
        );
      })}
      <button
        type="button"
        className="m-2 flex size-11 items-center justify-center rounded-full bg-yellow text-on-accent"
        aria-label="Cattura (arriva in fase 1)"
      >
        <Plus aria-hidden size={20} />
      </button>
    </nav>
  );
}
