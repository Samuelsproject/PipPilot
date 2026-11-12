import { Plane } from 'lucide-react';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" data-testid="brand-pippilot">
      <div className="grid size-10 shrink-0 place-items-center rounded-[14px] border border-[var(--pp-emerald)]/25 bg-[var(--pp-emerald)]/[.12] text-[var(--pp-emerald)]">
        <Plane className="size-[19px] -rotate-12" strokeWidth={1.8} aria-hidden="true" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="ambient-type text-[15px] font-bold tracking-[-0.04em] text-[var(--pp-text)]">
            PipPilot<span className="text-[var(--pp-emerald)]">Ai</span>
          </div>
          <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--pp-muted)]/65">
            Trading, with intent
          </div>
        </div>
      )}
    </div>
  );
}
