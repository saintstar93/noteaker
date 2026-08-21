import type { ReactNode } from 'react';

/**
 * Ogni lista vuota ha una frase e UN'AZIONE, mai un contenitore vuoto
 * (docs/03 §5).
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border border-dashed px-6 py-14 text-center">
      <p className="font-semibold text-[17px]">{title}</p>
      <p className="max-w-[46ch] text-[13px] text-fg-muted">{description}</p>
      {action}
    </div>
  );
}
