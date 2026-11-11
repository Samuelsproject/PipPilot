import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, CalendarDays, ChevronRight, CircleHelp, Clock3, Compass, ServerOff, ShieldCheck, Sparkles, WifiOff } from 'lucide-react';
import { DashboardButton, DemoTag, Panel, SectionHeading, SignalCard, StatCard, StatusBadge } from '@/components/dashboard-ui';

const times = ['M5', 'M15', 'H1', 'H4', 'D1'];
const marketWatch = [
  ['XAUUSD', '2,184.30'],
  ['EURUSD', '1.08426'],
  ['GBPUSD', '1.27148'],
  ['USDJPY', '149.382'],
  ['US30', '38,742.6'],
  ['US100', '17,965.4'],
];
const engineStatuses = [
  ['Technical analysis engine', 'status-engine-technical-analysis'],
  ['Economic news engine', 'status-engine-economic-news'],
  ['Risk management engine', 'status-engine-risk-management'],
];

function DemoChart({ timeframe }: { timeframe: string }) {
  return <div data-testid="chart-demo-preview" className="mt-3 overflow-hidden rounded-xl border border-white/[.05] bg-[var(--pp-color-surface-raised)] p-3">
    <div className="flex items-center justify-between"><span className="font-mono text-[10px] text-[var(--pp-muted)]">EUR / USD <span className="text-[9px]">· illustrative symbol</span></span><span className="text-[9px] text-[var(--pp-muted)]">Preview · {timeframe}</span></div>
    <svg viewBox="0 0 600 160" role="img" aria-label={`Illustrative chart preview, ${timeframe} selection; not market data`} className="mt-3 h-[142px] w-full">
      {[25, 62, 99, 136].map((y) => <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(220,240,230,.07)" strokeDasharray="3 6" />)}
      <path d="M0 113 C27 105 30 93 52 101 S80 85 105 96 S132 78 154 83 S183 101 205 85 S236 75 256 82 S278 60 304 70 S336 89 357 76 S382 49 407 62 S435 78 455 66 S487 61 506 71 S538 43 562 52 S581 46 600 35" fill="none" stroke="var(--pp-emerald)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      <path d="M0 113 C27 105 30 93 52 101 S80 85 105 96 S132 78 154 83 S183 101 205 85 S236 75 256 82 S278 60 304 70 S336 89 357 76 S382 49 407 62 S435 78 455 66 S487 61 506 71 S538 43 562 52 S581 46 600 35 L600 160 L0 160Z" fill="url(#chartFill)" opacity=".22" />
      <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--pp-emerald)" /><stop offset="1" stopColor="var(--pp-emerald)" stopOpacity="0" /></linearGradient></defs>
    </svg>
    <div className="mt-1 flex justify-between font-mono text-[8px] text-[var(--pp-muted)]/65"><span>09:00</span><span>12:00</span><span>15:00</span><span>18:00</span></div>
    <p className="mt-2 text-[9px] text-[var(--pp-warning)]">Illustrative chart graphic · no market feed · selection does not alter data</p>
  </div>;
}

export default function Home() {
  const [timeframe, setTimeframe] = useState('D1');
  const currentDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
  return <div className="page-enter space-y-6 sm:space-y-7">
    <section className="relative overflow-hidden rounded-[22px] border border-white/[.075] bg-[linear-gradient(120deg,var(--pp-color-surface-raised),var(--pp-surface)_54%,var(--pp-charcoal))] p-5 sm:p-7 lg:p-8">
      <div className="pointer-events-none absolute -right-20 -top-28 size-72 rounded-full border border-[var(--pp-emerald)]/[.12]" /><div className="pointer-events-none absolute -right-7 -top-14 size-44 rounded-full border border-[var(--pp-blue)]/[.09]" />
      <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-[720px]">
          <div className="mb-4 flex flex-wrap items-center gap-2"><span className="flex min-h-7 items-center gap-1.5 rounded-full border border-[var(--pp-emerald)]/20 bg-[var(--pp-emerald)]/[.09] px-2.5 text-[9px] font-bold uppercase tracking-[.1em] text-[var(--pp-emerald)]"><Compass className="size-3" />Your trading workspace</span><DemoTag /></div>
          <h1 className="ambient-type text-[clamp(1.9rem,5vw,3.1rem)] font-semibold leading-[1.07] tracking-[-.06em]"><span className="block text-[13px] font-medium tracking-normal text-[var(--pp-muted)]">Welcome, <span data-testid="text-demo-display-name" className="text-[var(--pp-text)]">Demo Trader</span> <span className="text-[10px] tracking-normal text-[var(--pp-muted)]">· display-name placeholder</span></span>Good context.<br className="sm:hidden" /> <span className="text-[var(--pp-emerald)]">Your call.</span></h1>
          <p className="mt-3 max-w-[540px] text-[12px] leading-[1.7] text-[var(--pp-muted)] sm:text-[13px]">A clear view of your workspace, designed to keep decisions human-led. Every figure below is sample content—not live market information or advice.</p>
          <p data-testid="text-current-date" className="mt-3 text-[10px] font-medium text-[var(--pp-muted)]">Today · {currentDate}</p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end"><StatusBadge>Demo · awaiting configuration</StatusBadge><span className="text-[9px] text-[var(--pp-muted)]">Sample system status · MT5 not connected</span></div>
      </div>
    </section>

    <section aria-label="Illustrative account overview" className="space-y-3">
      <SectionHeading eyebrow="Demo account snapshot" title="Account overview" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <StatCard label="Account Balance" value="$10,000.00" note="DEMO SAMPLE · fictional value" tone="blue" />
      <StatCard label="Account Equity" value="$10,125.00" note="DEMO SAMPLE · fictional value" tone="blue" />
      <StatCard label="Today's Profit/Loss" value="+$125.00" note="DEMO SAMPLE · illustrative positive P/L" tone="green" />
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-2">
      <Panel testId="panel-trading-status">
        <div className="flex items-start justify-between gap-2"><SectionHeading eyebrow="Trading status · demo state" title="Trading status" /><DemoTag /></div>
        <div className="mt-4 rounded-xl border border-[var(--pp-warning)]/15 bg-[var(--pp-warning)]/[.045] p-3.5">
          <div className="flex items-center gap-2"><ServerOff className="size-4 text-[var(--pp-warning)]" /><span className="text-[11px] font-semibold">Trading engine Offline</span><span data-testid="status-trading-engine" className="ml-auto rounded-md bg-[var(--pp-warning)]/10 px-2 py-1 text-[8px] font-bold uppercase text-[var(--pp-warning)]">Demo state</span></div>
          <p className="mt-1.5 text-[9px] text-[var(--pp-muted)]">No trading capability or service is connected.</p>
        </div>
        <div className="mt-3 divide-y divide-white/[.06]">
          {[['MT5', 'Not connected', 'status-mt5'], ['Active positions', '0', 'status-active-positions'], ['Pending signals', '0', 'status-pending-signals']].map(([label, value, id]) => <div key={label} className="flex min-h-11 items-center justify-between gap-3 py-2"><span className="text-[10px] text-[var(--pp-muted)]">{label}</span><span data-testid={id} className="text-[10px] font-semibold text-[var(--pp-text)]">{value} <span className="text-[8px] font-medium text-[var(--pp-warning)]">DEMO</span></span></div>)}
        </div>
        <p className="mt-2 text-[9px] leading-relaxed text-[var(--pp-muted)]">The sample signal cards below are fictional examples only; they are not active or pending.</p>
      </Panel>

      <Panel testId="panel-ai-engine-status">
        <div className="flex items-start justify-between gap-2"><SectionHeading eyebrow="System readiness · demo" title="AI engine status" /><DemoTag /></div>
        <div className="mt-3 divide-y divide-white/[.06]">
          {engineStatuses.map(([label, id]) => <div key={id} data-testid={id} className="flex min-h-[57px] items-center justify-between gap-3 py-2.5"><div className="min-w-0"><p className="text-[10px] font-semibold text-[var(--pp-text)]">{label}</p><p className="mt-1 text-[8px] text-[var(--pp-muted)]">Demo system state</p></div><span className="shrink-0 text-right text-[9px] font-semibold text-[var(--pp-warning)]">Awaiting configuration</span></div>)}
        </div>
        <p className="mt-2 text-[9px] text-[var(--pp-muted)]">No engine is running or producing analysis.</p>
      </Panel>
    </section>

    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.85fr)]">
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><SectionHeading eyebrow="Market overview · demo" title="EUR / USD context" /><p className="mt-2 text-[10px] text-[var(--pp-muted)]">All chart marks and quote values below are fictional samples.</p></div>
          <DemoTag />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--pp-color-surface-raised)] px-3 py-2.5">
          <div><p className="font-mono text-[18px] font-semibold tracking-tight">1.08426</p><p className="mt-0.5 text-[9px] text-[var(--pp-muted)]">Illustrative quote only</p></div>
          <div className="flex gap-1 rounded-lg bg-[var(--pp-charcoal)] p-1" role="group" aria-label="Choose timeframe">
            {times.map((item) => <DashboardButton key={item} onClick={() => setTimeframe(item)} aria-pressed={timeframe === item} data-testid={`button-timeframe-${item.toLowerCase()}`} active={timeframe === item}>{item}</DashboardButton>)}
          </div>
        </div>
        <DemoChart timeframe={timeframe} />
      </Panel>

      <Panel>
        <div className="flex items-start justify-between gap-2"><SectionHeading eyebrow="Structured context · sample data" title="Recent signals preview" /><DemoTag /></div>
        <p data-testid="text-signal-disclaimer" className="mb-3 mt-2 rounded-lg border border-[var(--pp-warning)]/20 bg-[var(--pp-warning)]/[.07] p-2.5 text-[10px] font-semibold leading-relaxed text-[var(--pp-warning)]">FICTIONAL SAMPLE DATA ONLY — These examples are not recommendations, instructions, active signals, or connected market data.</p>
        <div className="space-y-2.5">
          <SignalCard asset="XAUUSD" direction="SELL" timeframe="H1" entry="2,180.00" stopLoss="2,196.00" takeProfit="2,148.00" status="Sample only" />
          <SignalCard asset="EURUSD" direction="BUY" timeframe="M15" entry="1.08200" stopLoss="1.07850" takeProfit="1.08900" status="Sample only" />
          <SignalCard asset="US30" direction="BUY" timeframe="H4" entry="38,500.0" stopLoss="38,220.0" takeProfit="39,060.0" status="Sample only" />
        </div>
        <Link href="/trading" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-[10px] font-bold text-[var(--pp-emerald)] hover:bg-white/[.035]">Explore trading workspace <ArrowRight className="size-3.5" /></Link>
      </Panel>
    </section>

    <Panel testId="panel-market-watch">
      <div className="flex flex-wrap items-center justify-between gap-2"><SectionHeading eyebrow="Market watch" title="Six-market preview" /><DemoTag>DEMO DATA</DemoTag></div>
      <p className="mt-2 text-[9px] text-[var(--pp-muted)]">Every price below is a fictional placeholder, not a live quote.</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {marketWatch.map(([asset, price]) => <div key={asset} data-testid={`market-watch-${asset.toLowerCase()}`} className="rounded-xl border border-white/[.06] bg-[var(--pp-color-surface-raised)] p-3"><p className="ambient-type text-[10px] font-bold tracking-wide text-[var(--pp-text)]">{asset}</p><p className="mt-2 font-mono text-[12px] font-semibold text-[var(--pp-blue)]">{price}</p><p className="mt-1 text-[8px] text-[var(--pp-muted)]">DEMO PLACEHOLDER</p></div>)}
      </div>
    </Panel>

    <section className="grid gap-4 md:grid-cols-2">
      <Panel>
        <div className="flex items-center justify-between gap-2"><SectionHeading eyebrow="Upcoming · sample content" title="Calendar context" /><CalendarDays className="size-4 text-[var(--pp-blue)]" /></div>
        <div className="mt-4 space-y-3">
          {[['10:30', 'Central bank remarks', 'Sample event · medium'], ['14:00', 'Inflation report', 'Sample event · high']].map(([time, event, note]) => <div key={time} className="flex items-center gap-3 rounded-xl bg-[var(--pp-color-surface-raised)] p-3"><span className="min-w-[42px] font-mono text-[10px] text-[var(--pp-blue)]">{time}</span><div className="min-w-0"><p className="text-[11px] font-semibold">{event}</p><p className="mt-1 text-[9px] text-[var(--pp-muted)]">{note} · not a real calendar</p></div><ChevronRight className="ml-auto size-4 text-[var(--pp-muted)]/60" /></div>)}
        </div><p className="mt-3 text-[9px] text-[var(--pp-warning)]">Illustrative event names and times only. No calendar service connected.</p>
      </Panel>
      <Panel>
        <div className="flex items-center justify-between"><SectionHeading eyebrow="Workspace readiness" title="A quiet starting point" /><WifiOff className="size-4 text-[var(--pp-warning)]" /></div>
        <div className="mt-4 space-y-3">
          {[['Analysis engines', 'Awaiting configuration'], ['MetaTrader 5', 'Not connected'], ['Market & calendar feeds', 'Inactive']].map(([label, status]) => <div key={label} className="flex items-center justify-between gap-3 border-b border-white/[.06] pb-3 last:border-0 last:pb-0"><span className="text-[10px] text-[var(--pp-muted)]">{label}</span><span className="text-right text-[9px] font-semibold text-[var(--pp-warning)]">{status} · demo</span></div>)}
        </div>
        <Link href="/connections" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-[10px] font-bold text-[var(--pp-emerald)] hover:bg-white/[.035]">Review connection status <ArrowRight className="size-3.5" /></Link>
      </Panel>
    </section>

    <section className="flex flex-col gap-3 rounded-2xl border border-[var(--pp-blue)]/15 bg-[var(--pp-blue)]/[.045] p-4 sm:flex-row sm:items-center">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--pp-blue)]/[.1] text-[var(--pp-blue)]"><ShieldCheck className="size-4" /></div>
      <div className="min-w-0"><p className="text-[11px] font-semibold">Designed for you to stay in control</p><p className="mt-1 text-[10px] leading-relaxed text-[var(--pp-muted)]">No trade execution, recommendations, account connections, or live data are available in this frontend demo.</p></div>
      <Link href="/help" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-2 text-[10px] font-bold text-[var(--pp-blue)] hover:bg-white/[.04]"><CircleHelp className="size-3.5" />Demo guide <ChevronRight className="size-3" /></Link>
    </section>

    <footer className="flex flex-col gap-2 border-t border-white/[.07] pt-4 text-[9px] text-[var(--pp-muted)] sm:flex-row sm:items-center sm:justify-between"><span>PipPilotAi · product preview · all displayed content is illustrative</span><span className="flex items-center gap-1"><Clock3 className="size-3" />Local interface state only <Sparkles className="ml-2 size-3" /></span></footer>
  </div>;
}
