import type { ReactNode } from 'react';
import { ArrowUpRight, Compass, Layers3, ShieldCheck, Workflow } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { StatusPill } from '@/components/status-pill';

const navigation = [
  { label: 'Overview', href: '#overview', icon: Compass, current: true },
  { label: 'Capabilities', href: '#capabilities', icon: Layers3, current: false },
  { label: 'Principles', href: '#principles', icon: ShieldCheck, current: false },
];

export function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[244px] flex-col border-r border-white/[0.06] bg-[#111821]/80 px-5 pb-5 pt-7 backdrop-blur-xl lg:flex">
        <a href="#overview" className="w-fit rounded-lg" aria-label="PipPilotAi overview">
          <BrandMark />
        </a>
        <div className="mt-11 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">Workspace</div>
        <nav className="mt-3 space-y-1" aria-label="Workspace sections">
          {navigation.map(({ label, href, icon: Icon, current }) => (
            <a
              key={label}
              href={href}
              data-testid={`link-nav-${label.toLowerCase()}`}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-colors ${
                current
                  ? 'border border-emerald-300/10 bg-emerald-300/[0.08] text-emerald-200'
                  : 'text-slate-400 hover:bg-white/[0.035] hover:text-slate-200'
              }`}
            >
              <Icon className="size-[17px]" strokeWidth={1.7} aria-hidden="true" />
              {label}
              {current && <span className="ml-auto size-1.5 rounded-full bg-emerald-300" />}
            </a>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-300">
            <Workflow className="size-3.5 text-emerald-300" aria-hidden="true" />
            Foundation stage
          </div>
          <p className="mt-2 text-[11px] leading-[1.65] text-slate-500">
            Your workspace is being shaped. Connections are not active yet.
          </p>
          <StatusPill />
        </div>
        <div className="mt-5 flex items-center justify-between px-1 text-[10px] text-slate-600">
          <span>Independent product</span>
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </div>
      </aside>

      <div className="lg:pl-[244px]">
        <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#0f151d]/90 px-5 py-3.5 backdrop-blur-xl sm:px-8 lg:hidden">
          <div className="flex items-center justify-between">
            <a href="#overview" className="rounded-lg" aria-label="PipPilotAi overview">
              <BrandMark />
            </a>
            <StatusPill />
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
