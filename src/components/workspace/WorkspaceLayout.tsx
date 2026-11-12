import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  FlaskConical,
  HelpCircle,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Newspaper,
  Plug,
  Settings,
  Shield,
  Sparkles,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import { NavigationRoute, WorkspaceRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';

export interface WorkspaceNavItem {
  label: string;
  route: WorkspaceRoute;
  icon: LucideIcon;
  requiresApproval: boolean;
}

export const WORKSPACE_NAV_ITEMS: WorkspaceNavItem[] = [
  { label: 'Dashboard', route: '/app', icon: LayoutDashboard, requiresApproval: false },
  { label: 'Trading', route: '/app/trading', icon: Activity, requiresApproval: true },
  { label: 'Strategies', route: '/app/strategies', icon: Sparkles, requiresApproval: true },
  { label: 'News Intelligence', route: '/app/news', icon: Newspaper, requiresApproval: true },
  { label: 'Risk Management', route: '/app/risk', icon: Shield, requiresApproval: true },
  { label: 'MT5 Connections', route: '/app/mt5', icon: Plug, requiresApproval: true },
  { label: 'Signal History', route: '/app/signals', icon: Clock3, requiresApproval: true },
  { label: 'Backtesting', route: '/app/backtesting', icon: FlaskConical, requiresApproval: true },
  { label: 'Settings', route: '/app/settings', icon: Settings, requiresApproval: false },
  { label: 'Help and Support', route: '/app/support', icon: HelpCircle, requiresApproval: false },
];

interface WorkspaceLayoutProps {
  currentRoute: WorkspaceRoute;
  onNavigate: (route: NavigationRoute) => void;
  children: React.ReactNode;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  currentRoute,
  onNavigate,
  children,
}) => {
  const { user, emailVerified, membershipStatus, userRole, isApproved, logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const activeItem =
    WORKSPACE_NAV_ITEMS.find((item) => item.route === currentRoute) ?? WORKSPACE_NAV_ITEMS[0];

  const handleSignOut = async () => {
    setMobileDrawerOpen(false);
    await logout();
    onNavigate('/');
  };

  const handleSelectNav = (route: WorkspaceRoute) => {
    setMobileDrawerOpen(false);
    onNavigate(route);
  };

  // Close mobile drawer on Escape and lock body scroll while open
  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    };
  }, [mobileDrawerOpen]);

  const renderNavItem = (item: WorkspaceNavItem, compact: boolean, isMobile: boolean) => {
    const Icon = item.icon;
    const isActive = currentRoute === item.route;
    const isLocked = item.requiresApproval && !isApproved;

    return (
      <button
        key={`${isMobile ? 'mobile' : 'desktop'}-${item.route}`}
        type="button"
        onClick={() => handleSelectNav(item.route)}
        aria-current={isActive ? 'page' : undefined}
        title={compact ? item.label : undefined}
        data-testid={`nav-${isMobile ? 'mobile' : 'desktop'}-${item.route.replace('/app/', '').replace('/app', 'dashboard')}`}
        className={`w-full flex items-center gap-3 rounded-xl px-3 min-h-[44px] text-xs font-semibold transition-all text-left border ${
          isActive
            ? 'bg-[#16A36A]/15 text-[#16A36A] border-[#16A36A]/35 shadow-sm'
            : 'border-transparent text-[#A9BEB5] hover:bg-[#101B20]/70 hover:text-[#E8F2EE]'
        } ${compact ? 'justify-center px-2' : ''}`}
      >
        <Icon
          className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#16A36A]' : 'text-[#A9BEB5]'}`}
          aria-hidden="true"
        />
        {!compact && (
          <>
            <span className="truncate flex-1">{item.label}</span>
            {isLocked && (
              <Lock
                className="w-3.5 h-3.5 text-[#E69A36] shrink-0"
                aria-label="Approval required"
              />
            )}
            {isActive && !isLocked && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A] shrink-0" />
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#101B20] text-[#E8F2EE] flex font-['Plus_Jakarta_Sans',sans-serif] overflow-x-hidden">
      {/* Persistent Collapsible Left Sidebar (Desktop lg+) */}
      <aside
        aria-label="Workspace navigation"
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-[#152B30] border-r border-[#1A363E] transition-all duration-200 ${
          sidebarCollapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        {/* Brand Header + Collapse Toggle */}
        <div className="h-16 px-4 border-b border-[#1A363E] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleSelectNav('/app')}
            className="flex items-center gap-2.5 text-left focus:outline-none min-w-0"
            aria-label="PipPilotAi Dashboard"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#16A36A] via-[#168BFF] to-[#9560E8] p-[1.5px] shrink-0">
              <div className="w-full h-full bg-[#101B20] rounded-[10px] flex items-center justify-center">
                <Compass className="w-4 h-4 text-[#16A36A]" />
              </div>
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base tracking-tight text-[#E8F2EE] truncate">
                  PipPilot<span className="text-[#16A36A]">Ai</span>
                </span>
                <span className="text-[9px] font-mono text-[#A9BEB5] uppercase tracking-wider truncate">
                  Workspace
                </span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            data-testid="button-collapse-sidebar"
            className="p-1.5 rounded-lg bg-[#101B20] border border-[#1A363E] text-[#A9BEB5] hover:text-[#E8F2EE] transition-colors shrink-0"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* 10 Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!sidebarCollapsed && (
            <p className="px-3 pb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#A9BEB5]/70">
              Platform Modules
            </p>
          )}
          {WORKSPACE_NAV_ITEMS.map((item) => renderNavItem(item, sidebarCollapsed, false))}
        </nav>

        {/* Sidebar Footer Status */}
        <div className="p-3 border-t border-[#1A363E] space-y-2">
          {!sidebarCollapsed && (
            <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between font-mono">
                <span className="text-[#A9BEB5]">Access</span>
                <span
                  className={`font-bold ${
                    isApproved ? 'text-[#16A36A]' : 'text-[#E69A36]'
                  }`}
                >
                  {isApproved ? 'APPROVED' : 'PENDING'}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-[#A9BEB5]">MT5 Bridge</span>
                <span className="text-[#E69A36] font-semibold">In Dev</span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => onNavigate('/')}
            title="Public Homepage"
            className={`w-full flex items-center gap-2.5 rounded-xl px-3 min-h-[40px] text-xs font-semibold text-[#A9BEB5] hover:text-[#E8F2EE] hover:bg-[#101B20] transition-colors ${
              sidebarCollapsed ? 'justify-center px-2' : ''
            }`}
          >
            <ArrowLeft className="w-4 h-4 shrink-0 text-[#16A36A]" />
            {!sidebarCollapsed && <span>Public Homepage</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          sidebarCollapsed ? 'lg:pl-[76px]' : 'lg:pl-64'
        }`}
      >
        {/* Top Authentication & Membership Strip */}
        <div className="bg-[#152B30] border-b border-[#1A363E] px-3 sm:px-6 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0">
              <span className="font-mono text-[#E8F2EE] font-semibold flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-none">
                <User className="w-3.5 h-3.5 text-[#16A36A] shrink-0" />
                <span className="truncate">{user?.email}</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  emailVerified
                    ? 'bg-[#16A36A]/20 text-[#16A36A]'
                    : 'bg-[#E69A36]/20 text-[#E69A36]'
                }`}
              >
                {emailVerified ? 'Verified' : 'Unverified'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  isApproved
                    ? 'bg-[#16A36A]/15 text-[#16A36A] border-[#16A36A]/35'
                    : 'bg-[#9560E8]/20 text-[#E8F2EE] border-[#9560E8]/35'
                }`}
              >
                {membershipStatus === 'active'
                  ? 'Membership: Active'
                  : 'Membership: Pending Admin Approval'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#101B20] border border-[#1A363E] text-[#168BFF] uppercase">
                {userRole}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('/')}
                className="text-xs font-bold text-[#16A36A] hover:text-[#E8F2EE] transition-colors hidden sm:flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Public Homepage</span>
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs font-bold text-[#E05252] hover:underline flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Top Navigation Header */}
        <header className="bg-[#152B30]/95 border-b border-[#1A363E] px-3 sm:px-6 py-3 sticky top-0 z-20 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            {/* Left Side: Mobile Menu Button + Section Title */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                aria-label="Open left navigation menu"
                aria-haspopup="dialog"
                aria-controls="workspace-mobile-drawer"
                aria-expanded={mobileDrawerOpen}
                data-testid="button-open-left-drawer"
                className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] hover:border-[#16A36A]/50 transition-colors shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 lg:hidden shrink-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#16A36A] via-[#168BFF] to-[#9560E8] p-[1.5px]">
                  <div className="w-full h-full bg-[#101B20] rounded-[6px] flex items-center justify-center">
                    <Compass className="w-3.5 h-3.5 text-[#16A36A]" />
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-extrabold text-[#E8F2EE] purple-glow-text truncate">
                    {activeItem.label}
                  </h1>
                  <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-[#168BFF]/15 text-[#168BFF] border border-[#168BFF]/30">
                    {activeItem.route}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-[#A9BEB5] truncate">
                  PipPilotAi Semi-Automated Intelligence Terminal
                </p>
              </div>
            </div>

            {/* Right Side Quick Status */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#101B20] border border-[#1A363E] text-[11px] font-mono text-[#A9BEB5]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E69A36]" />
                MT5: Disconnected
              </span>
              <button
                type="button"
                onClick={() => onNavigate('/app/trading')}
                className="px-3 py-2 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold transition-colors hidden sm:inline-flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Trading</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Routed Workspace Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Left-Side Navigation Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close navigation drawer"
            onClick={() => setMobileDrawerOpen(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Left Slide-In Panel */}
          <aside
            id="workspace-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Workspace left navigation"
            className="absolute inset-y-0 left-0 w-[min(296px,85vw)] bg-[#152B30] border-r border-[#1A363E] shadow-2xl flex flex-col animate-in slide-in-from-left duration-200"
          >
            {/* Drawer Header */}
            <div className="px-4 py-3.5 border-b border-[#1A363E] bg-[#101B20]/80 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleSelectNav('/app')}
                className="flex items-center gap-2.5 text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#16A36A] via-[#168BFF] to-[#9560E8] p-[1.5px]">
                  <div className="w-full h-full bg-[#101B20] rounded-[10px] flex items-center justify-center">
                    <Compass className="w-4 h-4 text-[#16A36A]" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-base tracking-tight text-[#E8F2EE]">
                    PipPilot<span className="text-[#16A36A]">Ai</span>
                  </span>
                  <span className="text-[9px] font-mono text-[#A9BEB5] uppercase tracking-wider">
                    Workspace Menu
                  </span>
                </div>
              </button>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close navigation menu"
                data-testid="button-close-left-drawer"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#A9BEB5] hover:text-[#E8F2EE] hover:bg-[#1A363E] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              {WORKSPACE_NAV_ITEMS.map((item) => renderNavItem(item, false, true))}
            </nav>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-[#1A363E] bg-[#101B20]/60 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onNavigate('/');
                }}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-[#101B20] border border-[#1A363E] text-xs font-semibold text-[#E8F2EE] hover:border-[#16A36A]/50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-[#16A36A]" />
                <span>Public Homepage</span>
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-[#E05252]/10 border border-[#E05252]/30 text-xs font-bold text-[#E05252] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
