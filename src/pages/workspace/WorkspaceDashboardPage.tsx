import React from 'react';
import {
  Activity,
  ArrowRight,
  Calendar,
  Clock3,
  Cpu,
  FlaskConical,
  Lock,
  Plug,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { NavigationRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  CORE_ECONOMIC_EVENTS,
  MAX_SHARED_SIGNALS,
  SAMPLE_WATCHLIST,
  SHARED_PLATFORM_SIGNALS,
} from '../../data/workspaceData';

interface WorkspaceDashboardPageProps {
  onNavigate: (route: NavigationRoute) => void;
}

export const WorkspaceDashboardPage: React.FC<WorkspaceDashboardPageProps> = ({
  onNavigate,
}) => {
  const { user, emailVerified, membershipStatus, userRole, isApproved } = useAuth();
  const recentSignals = SHARED_PLATFORM_SIGNALS.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 1. Account & Connection Status + Quick Actions */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 purple-glow-box space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A363E] pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#16A36A]">
                Workspace Overview
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#E8F2EE] purple-glow-text">
                Account & Connection Status
              </h2>
            </div>
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                isApproved
                  ? 'bg-[#16A36A]/15 text-[#16A36A] border-[#16A36A]/35'
                  : 'bg-[#E69A36]/15 text-[#E69A36] border-[#E69A36]/35'
              }`}
            >
              {isApproved ? 'APPROVED MEMBER' : 'PENDING ADMIN APPROVAL'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
              <span className="text-[10px] text-[#A9BEB5] block">Authenticated User</span>
              <span className="font-bold text-[#E8F2EE] truncate block mt-0.5">
                {user?.email ?? 'Session active'}
              </span>
              <span className="text-[10px] text-[#16A36A] block mt-1">
                {emailVerified ? 'Email Verified' : 'Verification Pending'} · {userRole.toUpperCase()}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
              <span className="text-[10px] text-[#A9BEB5] block">Membership Tier</span>
              <span className="font-bold text-[#168BFF] block mt-0.5">
                {membershipStatus === 'active' ? 'Cohort Active' : 'Step 3: Pending'}
              </span>
              <span className="text-[10px] text-[#A9BEB5] block mt-1">
                {isApproved ? 'Full workspace unlocked' : 'Trading modules locked'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
              <span className="text-[10px] text-[#A9BEB5] block">MT5 Execution Bridge</span>
              <span className="font-bold text-[#E69A36] block mt-0.5">Disconnected</span>
              <span className="text-[10px] text-[#A9BEB5] block mt-1">
                Integration in development
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="lg:col-span-5 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1A363E] pb-3">
            <h3 className="text-sm font-bold text-[#E8F2EE]">Quick Trading Actions</h3>
            {!isApproved && (
              <span className="text-[10px] font-mono text-[#E69A36] flex items-center gap-1">
                <Lock className="w-3 h-3" /> Approval Required
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('/app/trading')}
              className="p-3 rounded-xl bg-[#101B20] hover:bg-[#1B363C] border border-[#1A363E] hover:border-[#16A36A]/50 text-left transition-colors group"
            >
              <Activity className="w-4 h-4 text-[#16A36A] mb-1.5" />
              <span className="block text-xs font-bold text-[#E8F2EE]">Open Trading</span>
              <span className="text-[10px] text-[#A9BEB5] flex items-center gap-1 mt-0.5">
                Analysis & setups <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/app/risk')}
              className="p-3 rounded-xl bg-[#101B20] hover:bg-[#1B363C] border border-[#1A363E] hover:border-[#168BFF]/50 text-left transition-colors group"
            >
              <Shield className="w-4 h-4 text-[#168BFF] mb-1.5" />
              <span className="block text-xs font-bold text-[#E8F2EE]">Risk Calculator</span>
              <span className="text-[10px] text-[#A9BEB5] flex items-center gap-1 mt-0.5">
                Position sizing <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/app/mt5')}
              className="p-3 rounded-xl bg-[#101B20] hover:bg-[#1B363C] border border-[#1A363E] hover:border-[#9560E8]/50 text-left transition-colors group"
            >
              <Plug className="w-4 h-4 text-[#9560E8] mb-1.5" />
              <span className="block text-xs font-bold text-[#E8F2EE]">MT5 Status</span>
              <span className="text-[10px] text-[#A9BEB5] flex items-center gap-1 mt-0.5">
                Bridge & mode <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/app/backtesting')}
              className="p-3 rounded-xl bg-[#101B20] hover:bg-[#1B363C] border border-[#1A363E] hover:border-[#E69A36]/50 text-left transition-colors group"
            >
              <FlaskConical className="w-4 h-4 text-[#E69A36] mb-1.5" />
              <span className="block text-xs font-bold text-[#E8F2EE]">Backtesting</span>
              <span className="text-[10px] text-[#A9BEB5] flex items-center gap-1 mt-0.5">
                Strategy lab <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Market Watchlist & 3. AI Engine Status */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#E8F2EE]">Market Watchlist</h3>
              <p className="text-[11px] text-[#A9BEB5]">
                Sample instrument snapshot (no live market feed connected)
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/app/trading')}
              className="text-xs font-bold text-[#168BFF] hover:underline flex items-center gap-1"
            >
              <span>Full Trading View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
            {SAMPLE_WATCHLIST.map((item) => (
              <div
                key={item.symbol}
                className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#E8F2EE]">{item.symbol}</span>
                  {item.positive ? (
                    <TrendingUp className="w-3.5 h-3.5 text-[#16A36A]" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-[#E05252]" />
                  )}
                </div>
                <span className="block text-sm font-bold text-[#168BFF]">{item.price}</span>
                <span
                  className={`block text-[10px] font-semibold ${
                    item.positive ? 'text-[#16A36A]' : 'text-[#E05252]'
                  }`}
                >
                  {item.change} · {item.bias}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#E8F2EE] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#9560E8]" />
              <span>AI Engine Status</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('/app/strategies')}
              className="text-xs font-bold text-[#168BFF] hover:underline flex items-center gap-1"
            >
              <span>Strategies</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] flex items-center justify-between">
              <span className="text-[#A9BEB5]">SMC / ICT / CRT Confluence</span>
              <span className="text-[#E69A36] font-bold">Preview Mode</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] flex items-center justify-between">
              <span className="text-[#A9BEB5]">Choppiness 'NO TRADE' Shield</span>
              <span className="text-[#16A36A] font-bold">Active (Rule Demo)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] flex items-center justify-between">
              <span className="text-[#A9BEB5]">Human Approval Gate</span>
              <span className="text-[#168BFF] font-bold">Enforced</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Recent Signal Summaries & 5. Risk Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#E8F2EE] flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-[#168BFF]" />
                <span>Recent Signal Summaries</span>
              </h3>
              <p className="text-[11px] text-[#A9BEB5]">
                Sample shared platform feed (capped at {MAX_SHARED_SIGNALS} max records)
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/app/signals')}
              className="text-xs font-bold text-[#168BFF] hover:underline flex items-center gap-1"
            >
              <span>All Signals ({MAX_SHARED_SIGNALS} Max)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {recentSignals.map((sig) => (
              <div
                key={sig.id}
                className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-bold text-[#E8F2EE]">{sig.pair}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sig.direction === 'BUY'
                        ? 'bg-[#16A36A]/20 text-[#16A36A]'
                        : sig.direction === 'SELL'
                        ? 'bg-[#E05252]/20 text-[#E05252]'
                        : 'bg-[#E69A36]/20 text-[#E69A36]'
                    }`}
                  >
                    {sig.direction === 'NO_TRADE' ? 'NO TRADE' : sig.direction}
                  </span>
                  <span className="text-[11px] text-[#A9BEB5] truncate">{sig.strategy}</span>
                </div>
                <div className="flex items-center gap-3">
                  {sig.riskReward && (
                    <span className="text-[#168BFF] font-bold">{sig.riskReward}</span>
                  )}
                  <span className="text-[10px] text-[#A9BEB5]">{sig.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#E8F2EE] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#16A36A]" />
              <span>Risk Overview</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('/app/risk')}
              className="text-xs font-bold text-[#168BFF] hover:underline flex items-center gap-1"
            >
              <span>Manage Risk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
              <span className="text-[10px] text-[#A9BEB5] block">Default Risk / Trade</span>
              <span className="text-base font-bold text-[#168BFF]">1.0%</span>
            </div>
            <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
              <span className="text-[10px] text-[#A9BEB5] block">Daily Loss Cap</span>
              <span className="text-base font-bold text-[#E05252]">3.0%</span>
            </div>
            <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
              <span className="text-[10px] text-[#A9BEB5] block">SL Validation</span>
              <span className="text-xs font-bold text-[#16A36A]">Mandatory</span>
            </div>
            <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
              <span className="text-[10px] text-[#A9BEB5] block">Correlated Exposure</span>
              <span className="text-xs font-bold text-[#E8F2EE]">Max 2 Pairs</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Upcoming CPI, PPI, NFP and FOMC Events */}
      <section className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#E8F2EE] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#168BFF]" />
              <span>Upcoming CPI, PPI, NFP & FOMC Events</span>
            </h3>
            <p className="text-[11px] text-[#A9BEB5]">
              Core macro catalysts monitored for pre-event volatility protection (sample schedule)
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/app/news')}
            className="text-xs font-bold text-[#168BFF] hover:underline flex items-center gap-1"
          >
            <span>News Intelligence</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
          {CORE_ECONOMIC_EVENTS.map((evt) => (
            <div
              key={evt.id}
              className="bg-[#101B20] p-3 rounded-xl border border-[#1A363E] space-y-1"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-bold text-[10px] ${
                    evt.impact === 'Critical' ? 'text-[#E05252]' : 'text-[#168BFF]'
                  }`}
                >
                  {evt.tag}
                </span>
                <span className="text-[10px] text-[#168BFF]">Est: {evt.forecast}</span>
              </div>
              <span className="text-[#E8F2EE] font-bold block">{evt.date}</span>
              <span className="text-[10px] text-[#A9BEB5] block truncate">
                {evt.affectedAssets.join(', ')}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Note */}
      <div className="p-3.5 rounded-xl bg-[#152B30]/60 border border-[#1A363E] flex flex-wrap items-center justify-between gap-2 text-xs text-[#A9BEB5]">
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#9560E8] shrink-0" />
          <span>
            This overview summarizes workspace modules. Select any navigation item on the left to open its dedicated view.
          </span>
        </span>
        <button
          type="button"
          onClick={() => onNavigate('/app/support')}
          className="text-[#16A36A] font-semibold hover:underline"
        >
          Platform Guidance
        </button>
      </div>
    </div>
  );
};
