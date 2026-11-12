import { CircleDashed } from 'lucide-react';

export function StatusPill({ children = 'Not configured' }: { children?: string }) {
  return (
    <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-[var(--pp-warning)]/15 bg-[var(--pp-warning)]/[0.07] px-2.5 text-[10px] font-semibold tracking-[0.02em] text-[var(--pp-warning)]" data-testid="status-not-configured">
      <CircleDashed className="size-3" strokeWidth={1.8} aria-hidden="true" />
      {children}
    </span>
  );
}
