import type { Item, SpaceColor } from '@noteaker/core';
import { cn } from '@noteaker/ui/cn';
import { Globe, Puzzle, Send, Smartphone } from 'lucide-react';
import { KIND_LABEL, SPACE_BORDER } from '@/lib/colors';

/**
 * La riga di lista: il componente più usato dell'app. Alta ~56px, nessuna
 * animazione — una cosa che scorri cento volte al giorno non deve rimbalzare.
 */

const SOURCE_ICON = {
  app: Globe,
  extension: Puzzle,
  ios_shortcut: Smartphone,
  telegram: Send,
} as const;

export function ItemRow({ item, color = 'blue' }: { item: Item; color?: SpaceColor }) {
  const SourceIcon = item.capturedVia ? SOURCE_ICON[item.capturedVia] : Globe;

  return (
    <article className="group flex items-stretch gap-3 rounded-md bg-surface-2 pr-4 hover:bg-surface-3">
      <span aria-hidden className={cn('w-1 shrink-0 rounded-l-md', SPACE_BORDER[color])} />
      <div className="flex min-h-14 min-w-0 flex-1 flex-col justify-center py-2">
        <h3 className="truncate font-medium text-[15px]">{item.title ?? 'Senza titolo'}</h3>
        <p className="flex items-center gap-2 text-[13px] text-fg-muted">
          <SourceIcon aria-hidden size={13} />
          <span>{KIND_LABEL[item.kind]}</span>
          {item.sourceDomain ? (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{item.sourceDomain}</span>
            </>
          ) : null}
        </p>
      </div>
    </article>
  );
}
