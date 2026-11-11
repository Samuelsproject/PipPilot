import { Plane } from 'lucide-react';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" data-testid="brand-pippilot">
      <div className="grid size-10 shrink-0 place-items-center rounded-[14px] border border-emerald-300/20 bg-emerald-400/10 text-emerald-300">
        <Plane className="size-[19px] -rotate-12" strokeWidth={1.8} aria-hidden="true" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-[-0.04em] text-slate-100">
            PipPilot<span className="text-emerald-300">Ai</span>
          </div>
          <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Trading, with intent
          </div>
        </div>
      )}
    </div>
  );
}
