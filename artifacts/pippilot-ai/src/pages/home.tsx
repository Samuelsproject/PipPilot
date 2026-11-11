import {
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CircleDot,
  CreditCard,
  Database,
  LockKeyhole,
  Plug,
  Settings2,
  ShieldAlert,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { StatusPill } from '@/components/status-pill';

const plannedCapabilities = [
  {
    title: 'Market context',
    detail: 'A considered view of market data and the events around it.',
    icon: BarChart3,
    tag: 'Market data',
  },
  {
    title: 'Analysis, made legible',
    detail: 'Structured trade ideas with the reasoning visible, not hidden.',
    icon: Sparkles,
    tag: 'Trading analysis',
  },
  {
    title: 'Calendar awareness',
    detail: 'Economic events presented as context for your own decisions.',
    icon: CalendarDays,
    tag: 'Economic calendar',
  },
  {
    title: 'Your platform, your control',
    detail: 'A future MT5 connection designed around clear permissions.',
    icon: Plug,
    tag: 'MT5 connection',
  },
];

const setupItems = [
  { title: 'Supabase authentication', note: 'Accounts and sessions', icon: LockKeyhole },
  { title: 'FastAPI services', note: 'Application foundation', icon: Workflow },
  { title: 'MT5 connectivity', note: 'Broker platform access', icon: Plug },
  { title: 'Market data', note: 'Live market feeds', icon: Database },
  { title: 'Economic calendar', note: 'Scheduled market events', icon: CalendarDays },
  { title: 'Trading analysis', note: 'Explainable decision support', icon: Sparkles },
  { title: 'Payments', note: 'Billing and subscriptions', icon: CreditCard },
  { title: 'Admin management', note: 'Product operations', icon: Settings2 },
];

export default function Home() {
  return (
    <div className="page-enter mx-auto max-w-[1440px] px-5 pb-16 pt-8 sm:px-8 sm:pt-10 lg:px-12 lg:pt-12">
      <section id="overview" className="scroll-mt-24">
        <div className="mb-8 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          <span className="size-1.5 rounded-full bg-emerald-300" />
          PipPilotAi workspace
          <span className="text-slate-700">/</span>
          Product foundation
        </div>

        <div className="grid gap-9 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.75fr)] xl:items-end">
          <div className="max-w-[760px]">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[10px] font-medium text-slate-400">
              <CircleDot className="size-3 text-emerald-300" aria-hidden="true" />
              Independent · human-led by design
            </div>
            <h1 className="ambient-type max-w-[760px] text-[clamp(2.5rem,6vw,5.25rem)] font-semibold leading-[1.02] tracking-[-0.065em] text-slate-50">
              Clarity for the
              <br className="hidden sm:block" /> decisions <span className="text-emerald-300">that matter.</span>
            </h1>
            <p className="mt-5 max-w-[590px] text-[15px] leading-[1.8] text-slate-400 sm:text-[16px]">
              PipPilotAi is being built as a trading intelligence workspace: clear context, explainable analysis, and your approval at every step. No opaque autopilot.
            </p>
            <a
              href="#capabilities"
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-400 px-5 text-[13px] font-bold text-[#10221b] transition-colors hover:bg-emerald-300"
              data-testid="link-explore-capabilities"
            >
              Explore the product direction
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>

          <div className="relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#141d26] p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full border border-emerald-300/[0.09]" />
            <div className="pointer-events-none absolute -right-5 -top-9 size-32 rounded-full border border-emerald-300/[0.12]" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">Current setup</p>
                <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.04em] text-slate-100">A clean starting point</h2>
              </div>
              <StatusPill />
            </div>
            <p className="relative mt-3 max-w-[390px] text-[12px] leading-[1.7] text-slate-400">
              This is the product foundation only. No accounts, trading connections, live data, or analysis are active.
            </p>
            <div className="relative mt-5 flex items-center gap-3 border-t border-white/[0.07] pt-4">
              <div className="grid size-9 place-items-center rounded-xl bg-emerald-300/[0.09] text-emerald-300">
                <ShieldAlert className="size-[17px]" strokeWidth={1.7} aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-200">Nothing can place a trade</p>
                <p className="mt-0.5 text-[10px] text-slate-500">Trading actions are not configured.</p>
              </div>
              <ArrowDownRight className="ml-auto size-4 text-slate-600" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-[20px] border border-amber-300/[0.13] bg-amber-300/[0.035] px-4 py-4 sm:flex sm:items-center sm:gap-4 sm:px-5" aria-label="Setup notice">
        <div className="mb-3 grid size-9 shrink-0 place-items-center rounded-xl border border-amber-300/[0.13] bg-amber-300/[0.06] text-amber-200 sm:mb-0">
          <CircleDot className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-amber-100">Workspace connections are not configured</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            Authentication, services, MT5, market data, calendar, billing, and administration are planned—not connected.
          </p>
        </div>
        <span className="mt-3 shrink-0 text-[9px] font-bold uppercase tracking-[0.17em] text-amber-200/70 sm:ml-auto sm:mt-0">No live account data</span>
      </section>

      <section id="capabilities" className="scroll-mt-24 pt-16 sm:pt-20">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">The direction</p>
            <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.05em] text-slate-100 sm:text-[31px]">Built to inform. Never to assume.</h2>
          </div>
          <p className="max-w-[340px] text-[12px] leading-[1.7] text-slate-500">
            These are planned capabilities, not available tools. Each should make the trader’s judgment stronger.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {plannedCapabilities.map(({ title, detail, icon: Icon, tag }, index) => (
            <article key={title} className="group relative min-h-[192px] overflow-hidden rounded-[18px] border border-white/[0.075] bg-[#121a23] p-5 transition-colors hover:border-emerald-300/20" data-testid={`card-capability-${index}`}>
              <div className="flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-emerald-300">
                  <Icon className="size-[17px]" strokeWidth={1.65} aria-hidden="true" />
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-600">Planned</span>
              </div>
              <h3 className="mt-5 text-[14px] font-semibold tracking-[-0.02em] text-slate-200">{title}</h3>
              <p className="mt-2 text-[11px] leading-[1.7] text-slate-500">{detail}</p>
              <div className="mt-4 flex items-center gap-1.5 text-[9px] font-medium text-slate-600">
                <span className="size-1 rounded-full bg-slate-600" />
                {tag} · not configured
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-8 rounded-[22px] border border-white/[0.07] bg-[#121a23] p-5 sm:p-7 lg:grid-cols-[.8fr_1.2fr] lg:gap-12" aria-labelledby="setup-title">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Setup map</p>
          <h2 id="setup-title" className="mt-2 text-[24px] font-semibold tracking-[-0.05em] text-slate-100">What comes next</h2>
          <p className="mt-3 max-w-[380px] text-[12px] leading-[1.75] text-slate-400">
            The essentials are intentionally visible. None are live in this first product foundation.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/[0.07] px-3 py-2 text-[10px] text-slate-400">
            <CircleDot className="size-3 text-orange-300" aria-hidden="true" />
            All systems are still ahead
          </div>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {setupItems.map(({ title, note, icon: Icon }) => (
            <div key={title} className="flex min-h-[66px] items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.035] text-slate-400">
                <Icon className="size-4" strokeWidth={1.7} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-slate-200">{title}</p>
                <p className="mt-1 text-[10px] text-slate-500">{note}</p>
              </div>
              <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 text-[9px] font-medium text-slate-500">
                <span className="size-1.5 rounded-full bg-orange-300/70" />
                Planned
              </span>
            </div>
          ))}
        </div>
      </section>

      <section id="principles" className="scroll-mt-24 pb-4 pt-16 sm:pt-20">
        <div className="grid gap-6 md:grid-cols-[.8fr_1.2fr] md:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">The operating principle</p>
            <h2 className="ambient-type mt-3 max-w-[420px] text-[28px] font-semibold leading-[1.12] tracking-[-0.055em] text-slate-100 sm:text-[35px]">
              The pilot helps you see. You stay in control.
            </h2>
          </div>
          <div className="border-l border-emerald-300/25 pl-5 sm:pl-7">
            <p className="max-w-[560px] text-[13px] leading-[1.85] text-slate-400">
              PipPilotAi is intended to make its context and reasoning understandable before any decision is yours to make. Human review is a product principle, not a setting hidden in a menu.
            </p>
            <p className="mt-3 text-[10px] font-medium text-slate-600">Planned direction · no automated trading is available</p>
          </div>
        </div>
      </section>

      <footer className="mt-12 flex flex-col gap-3 border-t border-white/[0.06] pt-5 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>PipPilotAi · independent trading intelligence workspace</span>
        <span className="flex items-center gap-2">
          <Check className="size-3 text-emerald-400/70" aria-hidden="true" />
          Foundation only. No integrations or financial data.
        </span>
      </footer>
    </div>
  );
}
