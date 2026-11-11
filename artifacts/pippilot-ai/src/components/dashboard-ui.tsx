import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Bell, CircleDashed, Info } from 'lucide-react';

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <div className="flex items-end justify-between gap-3">
    <div>{eyebrow && <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.17em] text-[var(--pp-muted)]">{eyebrow}</p>}
      <h2 className="ambient-type text-[17px] font-semibold tracking-[-.035em] text-[var(--pp-text)] sm:text-[19px]">{title}</h2></div>{action}
  </div>;
}

export function Panel({ children, className = '', testId }: { children: ReactNode; className?: string; testId?: string }) {
  return <section data-testid={testId} className={`rounded-[18px] border border-white/[.075] bg-[var(--pp-surface)] p-4 sm:p-5 ${className}`}>{children}</section>;
}

type DashboardButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function DashboardButton({ active = false, className = '', type = 'button', ...props }: DashboardButtonProps) {
  return <button
    type={type}
    className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-md px-2 text-[10px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pp-emerald)] ${active ? 'bg-[var(--pp-emerald)] text-[var(--pp-charcoal)]' : 'text-[var(--pp-muted)] hover:bg-white/[.06]'} ${className}`}
    {...props}
  />;
}

export function DemoTag({ children = 'DEMO DATA' }: { children?: string }) {
  return <span className="inline-flex min-h-6 items-center gap-1.5 rounded-full border border-[var(--pp-warning)]/20 bg-[var(--pp-warning)]/[.08] px-2.5 text-[9px] font-bold tracking-[.08em] text-[var(--pp-warning)]"><Info className="size-3" aria-hidden="true" />{children}</span>;
}

export function StatusBadge({ children = 'Awaiting setup' }: { children?: string }) {
  return <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-white/[.09] bg-white/[.035] px-2.5 text-[10px] font-semibold text-[var(--pp-muted)]"><CircleDashed className="size-3" aria-hidden="true" />{children}</span>;
}

export function StatCard({ label, value, note, tone = 'blue' }: { label: string; value: string; note: string; tone?: 'blue' | 'green' | 'red' }) {
  const valueTone = tone === 'blue' ? 'text-[var(--pp-blue)]' : tone === 'green' ? 'text-[var(--pp-emerald)]' : 'text-[var(--pp-error)]';
  const testId = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return <Panel testId={`stat-${testId}`} className="min-w-0 p-4">
    <div className="flex items-center justify-between gap-2"><p data-testid={`label-${testId}`} className="ambient-type truncate text-[11px] font-medium text-[var(--pp-muted)]">{label}</p><span className="shrink-0 text-[8px] font-bold tracking-[.1em] text-[var(--pp-warning)]">DEMO / SAMPLE</span></div>
    <p data-testid={`value-${testId}`} className={`ambient-type mt-3 font-mono text-[21px] font-semibold tracking-[-.05em] sm:text-[23px] ${valueTone}`}>{value}</p>
    <div className="mt-2 flex items-center gap-1 text-[10px] text-[var(--pp-muted)]"><span className="text-[9px]">{note}</span></div>
  </Panel>;
}

export function SignalCard({ asset, direction, timeframe, entry, stopLoss, takeProfit, status }: { asset: string; direction: 'BUY' | 'SELL'; timeframe: string; entry: string; stopLoss: string; takeProfit: string; status: string }) {
  const color = direction === 'BUY' ? 'var(--pp-emerald)' : 'var(--pp-error)';
  const detail = [['Timeframe', timeframe], ['Entry', entry], ['Stop loss', stopLoss], ['Take profit', takeProfit], ['Status', status]];
  return <article data-testid={`sample-signal-${asset.toLowerCase()}`} className="rounded-xl border border-white/[.06] bg-[var(--pp-color-surface-raised)] p-3.5">
    <div className="flex flex-wrap items-center gap-2"><span className="ambient-type text-[12px] font-bold text-[var(--pp-text)]">{asset}</span><span className="rounded-md px-2 py-1 text-[9px] font-bold" style={{ color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}>{direction}</span><span className="ml-auto text-[8px] font-bold tracking-[.1em] text-[var(--pp-warning)]">SAMPLE DATA</span></div>
    <dl className="mt-3 grid grid-cols-2 gap-x-2 gap-y-2 sm:grid-cols-3">
      {detail.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-[8px] uppercase tracking-[.08em] text-[var(--pp-muted)]">{label}</dt><dd className={`mt-1 truncate text-[10px] font-semibold ${label === 'Status' ? 'text-[var(--pp-warning)]' : 'font-mono text-[var(--pp-text)]'}`}>{value}</dd></div>)}
    </dl>
  </article>;
}

export function LoadingBlock({ label = 'Preparing demo workspace' }: { label?: string }) {
  return <div role="status" className="space-y-3 py-6"><span className="sr-only">{label}</span><div className="h-4 w-1/3 animate-pulse rounded bg-white/[.07]" /><div className="h-24 animate-pulse rounded-2xl bg-white/[.045]" /><div className="h-4 w-2/3 animate-pulse rounded bg-white/[.06]" /></div>;
}

export function DemoNotification() {
  return <div className="rounded-xl bg-white/[.035] p-3">
    <div className="flex items-start gap-2"><Bell className="mt-0.5 size-3.5 shrink-0 text-[var(--pp-blue)]" /><div><p className="text-[11px] font-semibold">Workspace preview is ready</p><p className="mt-1 text-[10px] leading-relaxed text-[var(--pp-muted)]">Sample notification only. No live market alerts or connected services.</p><span className="mt-2 block text-[9px] text-[var(--pp-muted)]/70">Illustrative · just now</span></div></div>
  </div>;
}

export function NotificationIndicator() {
  return <span aria-hidden="true" className="absolute right-[10px] top-[9px] size-1.5 rounded-full bg-[var(--pp-blue)]" />;
}
