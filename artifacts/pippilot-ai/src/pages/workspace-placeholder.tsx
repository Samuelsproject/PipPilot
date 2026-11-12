import { Link } from 'wouter';
import { ArrowRight, CircleHelp, Compass, FlaskConical, Newspaper, Plug, ShieldCheck, Sparkles, Activity, Clock3, Settings2 } from 'lucide-react';
import { DemoTag, Panel, SectionHeading, StatusBadge } from '@/components/dashboard-ui';

const content = {
  trading: { title: 'Trading workspace', eyebrow: 'Human-led workflow', icon: Activity, description: 'A future place for reviewing market context before you make a decision. No orders, market prices, or trading actions are available in this demo.', items: ['Market context preview', 'Structured review notes', 'Decision checkpoints'] },
  strategies: { title: 'Strategies', eyebrow: 'Research workspace', icon: Sparkles, description: 'A placeholder for strategy ideas, methodology notes, and transparent review. The analysis engine is awaiting configuration. All names below are fictional samples, not strategies or recommendations.', items: ['SAMPLE STRATEGY · Session Structure', 'SAMPLE STRATEGY · Momentum Map', 'SAMPLE STRATEGY · Risk-First Reversal'] },
  news: { title: 'News Intelligence', eyebrow: 'Context, not a cue', icon: Newspaper, description: 'A planned view for scheduled events and relevant context. The sample items below are fictional and are not connected to a calendar or news source.', items: ['Central bank update · illustrative', 'Inflation release · illustrative', 'Session overview · placeholder'] },
  risk: { title: 'Risk overview', eyebrow: 'Protect your process', icon: ShieldCheck, description: 'A future workspace for reviewing exposure and guardrails. All engines await configuration; no account or position data is present.', items: ['Exposure review · unavailable', 'Risk limits · not configured', 'Account protection · planned'] },
  connections: { title: 'Connections', eyebrow: 'Your services, your control', icon: Plug, description: 'No services are connected in this local frontend preview. Connection controls are intentionally not active.', items: ['MetaTrader 5 · not connected', 'Market data · inactive', 'Economic calendar · inactive'] },
  history: { title: 'Activity history', eyebrow: 'A clear record', icon: Clock3, description: 'This area will provide a reviewable record once the product is configured. No trading activity or account history is loaded here.', items: ['No account activity available', 'No executions or orders', 'Local preview only'] },
  backtesting: { title: 'Backtesting', eyebrow: 'Explore with care', icon: FlaskConical, description: 'A planned environment for exploring historical scenarios. No test has been run and no historical market data is available.', items: ['Backtest engine · awaiting configuration', 'Historical data · not connected', 'Results · none in demo'] },
  settings: { title: 'Workspace settings', eyebrow: 'Preferences', icon: Settings2, description: 'This interface preview uses local display state only. There are no accounts, saved preferences, or server-side settings.', items: ['Profile · local demo', 'Notifications · sample only', 'Security & access · not configured'] },
  help: { title: 'Help & guidance', eyebrow: 'PipPilotAi guide', icon: CircleHelp, description: 'PipPilotAi is a trading-intelligence workspace designed to provide context while keeping decisions in your hands. This frontend is a non-connected product preview.', items: ['All values and alerts are illustrative', 'MT5 and data sources are not connected', 'No recommendations or trade execution'] },
};

type PageKey = keyof typeof content;
export function WorkspacePlaceholder({ page }: { page: PageKey }) {
  const data = content[page];
  const Icon = data.icon;
  return <div className="page-enter mx-auto max-w-[900px] space-y-5">
    <section className="rounded-[22px] border border-white/[.075] bg-[linear-gradient(130deg,var(--pp-color-surface-raised),var(--pp-surface))] p-5 sm:p-7">
      <div className="flex items-start gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-[14px] border border-[var(--pp-emerald)]/15 bg-[var(--pp-emerald)]/[.08] text-[var(--pp-emerald)]"><Icon className="size-5" /></div>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--pp-muted)]">{data.eyebrow}</p><DemoTag /></div><h1 className="ambient-type mt-2 text-[clamp(1.7rem,5vw,2.6rem)] font-semibold tracking-[-.055em]">{data.title}</h1><p className="mt-3 max-w-[640px] text-[12px] leading-[1.75] text-[var(--pp-muted)]">{data.description}</p></div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2"><StatusBadge>Demo · awaiting configuration</StatusBadge><span className="text-[9px] text-[var(--pp-muted)]">Sample status · MT5 not connected · no live services</span></div>
    </section>
    <Panel>
      <SectionHeading eyebrow="Workspace preview" title="What belongs here" />
      <div className="mt-4 divide-y divide-white/[.06]">
        {data.items.map((item, index) => <div key={item} data-testid={`placeholder-item-${page}-${index + 1}`} className="flex min-h-[56px] items-center gap-3"><span className="size-1.5 shrink-0 rounded-full bg-[var(--pp-emerald)]/80" /><p className={`text-[11px] text-[var(--pp-text)] ${page === 'strategies' ? 'ambient-type' : ''}`}>{item}</p><span className="ml-auto text-right text-[8px] font-bold uppercase tracking-[.1em] text-[var(--pp-warning)]">Placeholder</span></div>)}
      </div>
    </Panel>
    <Panel className="bg-[var(--pp-color-surface-raised)]">
      <div className="flex items-start gap-3"><Compass className="mt-0.5 size-4 shrink-0 text-[var(--pp-blue)]" /><div><h2 className="text-[12px] font-semibold">Preview state, not a live workspace</h2><p className="mt-1.5 text-[10px] leading-relaxed text-[var(--pp-muted)]">All modules are illustrative. No authentication, account connection, market feed, financial service, or trading behavior is active.</p></div></div>
    </Panel>
    <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-[10px] font-bold text-[var(--pp-emerald)] hover:bg-white/[.035]">Back to dashboard <ArrowRight className="size-3.5" /></Link>
  </div>;
}
