import React, { useState } from 'react';
import { Bell, CheckCircle2, KeyRound, LogOut, Shield, Sliders, User } from 'lucide-react';
import { NavigationRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AssetSymbol, TimeframeOption } from '../../data/workspaceData';

interface SettingsPageProps {
  onNavigate: (route: NavigationRoute) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user, emailVerified, membershipStatus, userRole, isAdmin, logout } = useAuth();

  const [defaultPair, setDefaultPair] = useState<AssetSymbol>('XAU/USD');
  const [defaultTimeframe, setDefaultTimeframe] = useState<TimeframeOption>('M15');
  const [requireManualConfirm, setRequireManualConfirm] = useState(true);
  const [notifySignals, setNotifySignals] = useState(true);
  const [notifyMacro, setNotifyMacro] = useState(true);
  const [notifyNoTrade, setNotifyNoTrade] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleSignOut = async () => {
    await logout();
    onNavigate('/');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: User Profile + Security & Session Management */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 purple-glow-box space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A363E] pb-3">
              <span className="text-xs font-mono font-bold text-[#E8F2EE] flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#16A36A]" />
                User Profile & Permissions
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#168BFF]/15 text-[#168BFF] uppercase">
                {userRole}
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
                <span className="text-[10px] text-[#A9BEB5] block">Email Address</span>
                <span className="font-bold text-[#E8F2EE] break-all">
                  {user?.email ?? 'Unavailable'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] flex justify-between">
                <span className="text-[#A9BEB5]">Email Verification</span>
                <span className={emailVerified ? 'text-[#16A36A] font-bold' : 'text-[#E69A36] font-bold'}>
                  {emailVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] flex justify-between">
                <span className="text-[#A9BEB5]">Membership Status</span>
                <span className={membershipStatus === 'active' ? 'text-[#16A36A] font-bold' : 'text-[#E69A36] font-bold'}>
                  {membershipStatus === 'active' ? 'Active' : 'Pending Admin Approval'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] flex justify-between">
                <span className="text-[#A9BEB5]">Admin Access</span>
                <span className="text-[#E8F2EE] font-bold">
                  {isAdmin ? 'Admin Role' : 'Ordinary Trader (No Admin Access)'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8F2EE] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#168BFF]" />
              Security & Session Management
            </h3>
            <p className="text-xs text-[#A9BEB5] leading-relaxed">
              Sessions and role claims are managed via Supabase Auth. Admin permissions remain strictly separate from ordinary trader accounts.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('/forgot-password')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#101B20] hover:bg-[#1B363C] border border-[#1A363E] text-xs font-semibold text-[#E8F2EE] flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#168BFF]" />
                <span>Reset Password</span>
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#E05252]/10 hover:bg-[#E05252]/20 border border-[#E05252]/30 text-xs font-bold text-[#E05252] flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Preferences, Notifications & Trading Preferences */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#1A363E] pb-3">
            <span className="text-sm font-bold text-[#E8F2EE] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#16A36A]" />
              Workspace & Trading Preferences
            </span>
            <span className="text-[10px] font-mono text-[#A9BEB5]">Local UI Preferences</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-[#A9BEB5] mb-1.5">Default Instrument</label>
              <select
                value={defaultPair}
                onChange={(e) => setDefaultPair(e.target.value as AssetSymbol)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] focus:outline-none focus:border-[#16A36A]"
              >
                <option value="XAU/USD">XAU/USD</option>
                <option value="EUR/USD">EUR/USD</option>
                <option value="GBP/USD">GBP/USD</option>
                <option value="US30">US30</option>
              </select>
            </div>
            <div>
              <label className="block text-[#A9BEB5] mb-1.5">Default Chart Timeframe</label>
              <select
                value={defaultTimeframe}
                onChange={(e) => setDefaultTimeframe(e.target.value as TimeframeOption)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] focus:outline-none focus:border-[#16A36A]"
              >
                {(['M5', 'M15', 'H1', 'H4', 'D1'] as const).map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-3 pt-2 border-t border-[#1A363E]">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8F2EE] flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-[#168BFF]" />
              Notification Preferences
            </h4>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#101B20] border border-[#1A363E] cursor-pointer text-xs">
              <span className="text-[#E8F2EE]">New Signal Review Alerts</span>
              <input
                type="checkbox"
                checked={notifySignals}
                onChange={(e) => setNotifySignals(e.target.checked)}
                className="accent-[#16A36A] w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#101B20] border border-[#1A363E] cursor-pointer text-xs">
              <span className="text-[#E8F2EE]">CPI / PPI / NFP / FOMC Reminders</span>
              <input
                type="checkbox"
                checked={notifyMacro}
                onChange={(e) => setNotifyMacro(e.target.checked)}
                className="accent-[#16A36A] w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#101B20] border border-[#1A363E] cursor-pointer text-xs">
              <span className="text-[#E8F2EE]">NO TRADE Capital Shield Notices</span>
              <input
                type="checkbox"
                checked={notifyNoTrade}
                onChange={(e) => setNotifyNoTrade(e.target.checked)}
                className="accent-[#16A36A] w-4 h-4"
              />
            </label>
          </div>

          {/* Trading Preferences */}
          <div className="space-y-2 pt-2 border-t border-[#1A363E]">
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#101B20] border border-[#16A36A]/35 cursor-pointer text-xs">
              <div>
                <span className="font-bold text-[#E8F2EE] block">
                  Mandatory Human Approval Gate
                </span>
                <span className="text-[11px] text-[#A9BEB5]">
                  Always require explicit trader review prior to MT5 validation
                </span>
              </div>
              <input
                type="checkbox"
                checked={requireManualConfirm}
                onChange={(e) => setRequireManualConfirm(e.target.checked)}
                className="accent-[#16A36A] w-4 h-4"
              />
            </label>
          </div>

          {savedNotice && (
            <div className="p-3 rounded-xl bg-[#16A36A]/15 border border-[#16A36A]/40 text-xs text-[#16A36A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Workspace preferences updated for this session.</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
