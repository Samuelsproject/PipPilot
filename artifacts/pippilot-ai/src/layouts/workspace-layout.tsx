import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Activity, Bell, BookOpen, ChartNoAxesCombined, ChevronDown, CircleHelp, Clock3, FlaskConical, LayoutDashboard, Menu, Newspaper, Plug, Settings, Shield, Sparkles, UserRound, X, type LucideIcon } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { DemoNotification, StatusBadge, DemoTag, NotificationIndicator } from '@/components/dashboard-ui';

const navigation = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Trading', href: '/trading', icon: Activity },
  { label: 'Strategies', href: '/strategies', icon: Sparkles },
  { label: 'News Intelligence', href: '/news', icon: Newspaper },
  { label: 'Risk Management', href: '/risk', icon: Shield },
  { label: 'MT5 Connections', href: '/connections', icon: Plug },
  { label: 'Signal History', href: '/history', icon: Clock3 },
  { label: 'Backtesting', href: '/backtesting', icon: FlaskConical },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Help and Support', href: '/help', icon: CircleHelp },
];

function NavigationItem({ label, href, icon: Icon, active, onClick }: {
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
  onClick?: () => void;
}) {
  return <Link href={href} onClick={onClick} aria-current={active ? 'page' : undefined}
    data-testid={`link-nav-${onClick ? 'mobile-' : 'desktop-'}${href === '/' ? 'dashboard' : href.slice(1)}`}
    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[12px] font-semibold transition-colors ${active ? 'bg-[var(--pp-emerald)]/[.13] text-[var(--pp-emerald)]' : 'text-[var(--pp-muted)] hover:bg-white/[.045] hover:text-[var(--pp-text)]'}`}>
    <Icon className="size-[16px]" strokeWidth={1.8} aria-hidden="true" /><span className="ambient-type">{label}</span>{active && <span className="ml-auto size-1.5 rounded-full bg-[var(--pp-emerald)]" />}
  </Link>;
}

export function WorkspaceLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const title = navigation.find((item) => item.href === location)?.label ?? 'Workspace';

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false); setNotificationsOpen(false); setProfileOpen(false);
      }
    };
    const onOutside = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false); setProfileOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onOutside);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onOutside); };
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const getFocusableItems = () => drawerRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? [];
    getFocusableItems()[0]?.focus();
    const onDrawerKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setDrawerOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = getFocusableItems();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onDrawerKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onDrawerKeyDown);
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    };
  }, [drawerOpen]);

  const links = (mobile = false) => navigation.map(({ label, href, icon }) => (
    <NavigationItem
      key={href}
      label={label}
      href={href}
      icon={icon}
      active={location === href}
      onClick={mobile ? () => setDrawerOpen(false) : undefined}
    />
  ));

  return <div className="min-h-[100dvh] text-[var(--pp-text)]">
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[236px] flex-col border-r border-white/[.07] bg-[var(--pp-charcoal)] px-4 pb-4 pt-6 lg:flex">
      <Link href="/" aria-label="PipPilotAi dashboard" className="ml-2 w-fit rounded-lg"><BrandMark /></Link>
      <div className="mb-2 mt-9 px-3 text-[9px] font-bold uppercase tracking-[.18em] text-[var(--pp-muted)]/65">Workspace</div>
      <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto">{links()}</nav>
        <div data-testid="status-system-demo" className="mt-4 rounded-2xl border border-white/[.07] bg-white/[.025] p-3.5">
        <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.1em] text-[var(--pp-muted)]">System status</span><span className="size-1.5 rounded-full bg-[var(--pp-warning)]" /></div>
        <p className="mt-2 text-[11px] font-semibold text-[var(--pp-text)]">Demo environment</p>
        <p className="mt-1 text-[10px] leading-relaxed text-[var(--pp-muted)]">Engines await configuration. MT5 is not connected.</p>
      </div>
      <div className="mt-4 px-2"><DemoTag /></div>
    </aside>

    <div className="lg:pl-[236px]">
      <header ref={headerRef} className="sticky top-0 z-30 border-b border-white/[.07] bg-[var(--pp-charcoal)]/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button ref={menuButtonRef} type="button" onClick={() => setDrawerOpen(true)} aria-label="Open navigation menu" aria-haspopup="dialog" aria-controls="mobile-nav-drawer" aria-expanded={drawerOpen} data-testid="button-open-drawer" className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-white/[.035] text-[var(--pp-text)] lg:hidden"><Menu className="size-5" /></button>
            <Link href="/" className="flex items-center gap-2 rounded-lg lg:hidden" aria-label="PipPilotAi dashboard"><BrandMark compact /><span className="ambient-type whitespace-nowrap text-[13px] font-bold tracking-[-.035em] text-[var(--pp-text)]">PipPilotAi</span></Link>
            <div className="hidden lg:block"><p className="text-[9px] font-semibold uppercase tracking-[.16em] text-[var(--pp-muted)]">PipPilotAi / workspace</p><h1 className="ambient-type mt-0.5 text-[15px] font-semibold">{title}</h1></div>
            <span className="ml-1 hidden sm:inline-flex lg:hidden"><StatusBadge>Demo workspace</StatusBadge></span>
          </div>
          <div className="relative flex items-center gap-2">
            <button type="button" onClick={() => { setNotificationsOpen((v) => !v); setProfileOpen(false); }} aria-label="Notifications (demo)" aria-haspopup="dialog" aria-controls="notifications-panel" aria-expanded={notificationsOpen} data-testid="button-notifications" className="relative grid size-11 place-items-center rounded-xl text-[var(--pp-muted)] hover:bg-white/[.05] hover:text-[var(--pp-text)]"><Bell className="size-[18px]" /><NotificationIndicator /></button>
            <button type="button" onClick={() => { setProfileOpen((v) => !v); setNotificationsOpen(false); }} aria-label="Open user menu" aria-haspopup="menu" aria-controls="profile-menu" aria-expanded={profileOpen} data-testid="button-user-menu" className="flex min-h-11 items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.035] pl-1.5 pr-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-[var(--pp-emerald)]/15 text-[11px] font-bold text-[var(--pp-emerald)]">PP</span><span className="hidden text-left sm:block"><span className="block text-[10px] font-semibold">Pilot profile</span><span className="block text-[9px] text-[var(--pp-muted)]">Local demo</span></span><ChevronDown className="hidden size-3 text-[var(--pp-muted)] sm:block" />
            </button>
            {notificationsOpen && <div id="notifications-panel" role="dialog" aria-label="Notifications" className="absolute right-0 top-[52px] z-50 w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-white/[.1] bg-[var(--pp-color-surface-raised)] p-4 shadow-2xl">
              <div className="flex items-center justify-between"><h2 className="text-[13px] font-semibold">Notifications</h2><DemoTag /></div>
              <div className="mt-4"><DemoNotification /></div>
              <p className="mt-3 text-[9px] text-[var(--pp-muted)]">There are no real alerts in this demo.</p>
            </div>}
            {profileOpen && <div id="profile-menu" role="menu" aria-label="User menu" className="absolute right-0 top-[52px] z-50 w-[220px] rounded-2xl border border-white/[.1] bg-[var(--pp-color-surface-raised)] p-2 shadow-2xl">
              <div className="px-3 py-2"><p className="text-[11px] font-semibold">Pilot profile</p><p className="mt-1 text-[9px] text-[var(--pp-muted)]">Local preview · no account</p></div>
              <Link role="menuitem" href="/settings" onClick={() => setProfileOpen(false)} className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-[11px] text-[var(--pp-muted)] hover:bg-white/[.05]"><UserRound className="size-4" />Preferences</Link>
              <Link role="menuitem" href="/help" onClick={() => setProfileOpen(false)} className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-[11px] text-[var(--pp-muted)] hover:bg-white/[.05]"><BookOpen className="size-4" />Help & guidance</Link>
            </div>}
          </div>
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100dvh-68px)] max-w-[1480px] px-4 pb-24 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-10">{children}</main>
    </div>

    {drawerOpen && <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
      <button type="button" aria-label="Close navigation overlay" onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-[var(--pp-charcoal)]/75 backdrop-blur-[2px]" />
      <aside ref={drawerRef} id="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Main navigation" className="absolute inset-y-0 left-0 flex w-[min(310px,86vw)] flex-col border-r border-white/[.08] bg-[var(--pp-surface)] px-4 pb-5 pt-5 shadow-2xl">
        <div className="flex items-center justify-between px-1"><Link href="/" onClick={() => setDrawerOpen(false)} aria-label="PipPilotAi dashboard"><BrandMark /></Link><button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close navigation menu" data-testid="button-close-drawer" className="grid size-11 place-items-center rounded-xl text-[var(--pp-muted)] hover:bg-white/[.06]"><X className="size-5" /></button></div>
        <div className="mb-2 mt-8 px-3 text-[9px] font-bold uppercase tracking-[.18em] text-[var(--pp-muted)]/65">Your workspace</div>
        <nav aria-label="Mobile main navigation" className="flex-1 space-y-1 overflow-y-auto">{links(true)}</nav>
        <div className="mt-4 rounded-xl border border-white/[.08] bg-white/[.025] p-3"><div className="flex items-center gap-2 text-[10px] font-semibold"><ChartNoAxesCombined className="size-4 text-[var(--pp-emerald)]" />Demo mode</div><p className="mt-1.5 text-[9px] leading-relaxed text-[var(--pp-muted)]">Illustrative interface only. No live data or trading actions.</p></div>
      </aside>
    </div>}
  </div>;
}
