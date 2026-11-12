import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  Layers, 
  Calendar, 
  Cpu, 
  Workflow, 
  ShieldAlert, 
  Clock, 
  Zap, 
  Check, 
  AlertCircle,
  User,
  LogOut,
  LogIn,
  KeyRound
} from 'lucide-react';
import { NavigationRoute } from '../types';
import { useAuth } from '../context/AuthContext';

interface DashboardPreviewPageProps {
  onNavigate: (route: NavigationRoute) => void;
}

export const DashboardPreviewPage: React.FC<DashboardPreviewPageProps> = ({ onNavigate }) => {
  const { user, emailVerified, membershipStatus, logout } = useAuth();

  const [selectedAsset, setSelectedAsset] = useState<'XAU/USD' | 'EUR/USD' | 'GBP/USD' | 'US30'>('XAU/USD');
  const [timeframe, setTimeframe] = useState<'M5' | 'M15' | 'H1' | 'H4' | 'D1'>('M15');
  const [approvalStatus, setApprovalStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'MT5_VALIDATED'>('PENDING');
  const [showNoTradeDemo, setShowNoTradeDemo] = useState(false);

  // Risk parameters in the preview
  const [accountBalance, setAccountBalance] = useState(25000);
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [stopLossPips, setStopLossPips] = useState(30);

  const riskAmount = (accountBalance * riskPercent) / 100;
  const calculatedLotSize = +(riskAmount / (stopLossPips * 10)).toFixed(2);

  const assetDetails = {
    'XAU/USD': { name: 'Gold Spot / USD', price: '2,648.40', change: '+0.64%', bias: 'Bullish SMC' },
    'EUR/USD': { name: 'Euro / US Dollar', price: '1.0842', change: '-0.12%', bias: 'Neutral ICT' },
    'GBP/USD': { name: 'British Pound / USD', price: '1.2985', change: '+0.28%', bias: 'Bullish BOS' },
    'US30': { name: 'Dow Jones Index', price: '43,890.10', change: '+0.45%', bias: 'Bullish Expansion' }
  }[selectedAsset];

  const handleSignOut = async () => {
    await logout();
    onNavigate('/');
  };

  return (
    <div className="min-h-screen bg-[#101B20] text-[#E8F2EE] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Banner Notice: Authentication & Membership Separation Banner */}
      <div className="bg-[#152B30] border-b border-[#1A363E] px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs">
          {user ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-[#E8F2EE] font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#16A36A]" />
                {user.email}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                emailVerified ? 'bg-[#16A36A]/20 text-[#16A36A]' : 'bg-[#E69A36]/20 text-[#E69A36]'
              }`}>
                {emailVerified ? 'Email Verified ✓' : 'Email Unverified ⚠️'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#9560E8]/20 text-[#E8F2EE] border border-[#9560E8]/30">
                Membership: Pending Admin Approval (Step 3)
              </span>
              <span className="text-[11px] text-[#A9BEB5] hidden lg:inline">
                • Verified email confirms identity; live trading execution requires cohort admin approval.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#E69A36]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                <strong>Preview Mode:</strong> Demonstrating terminal interface. Sign in with Supabase to test persistent authenticated session state.
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
            {user ? (
              <button
                onClick={handleSignOut}
                className="text-xs font-bold text-[#E05252] hover:underline flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('/login')}
                className="text-xs font-bold text-[#168BFF] hover:underline flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
            <span className="text-[#1A363E]">|</span>
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-1.5 text-xs font-bold text-[#16A36A] hover:text-[#E8F2EE] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Homepage</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Navigation Header */}
      <header className="bg-[#152B30]/95 border-b border-[#1A363E] px-4 sm:px-6 py-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/')}
              className="p-1.5 rounded-lg bg-[#101B20] border border-[#1A363E] text-[#A9BEB5] hover:text-[#E8F2EE] transition-colors"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-[#E8F2EE] flex items-center gap-1">
                PipPilot<span className="text-[#16A36A]">Ai</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#168BFF]/15 text-[#168BFF] border border-[#168BFF]/30 ml-2">
                  DASHBOARD PREVIEW
                </span>
              </span>
              <span className="text-[10px] font-mono text-[#A9BEB5]">
                Semi-Automated Intelligence Terminal
              </span>
            </div>
          </div>

          {/* Asset Switcher Bar */}
          <div className="flex items-center gap-1 bg-[#101B20] p-1 rounded-xl border border-[#1A363E]">
            {(['XAU/USD', 'EUR/USD', 'GBP/USD', 'US30'] as const).map((asset) => (
              <button
                key={asset}
                onClick={() => {
                  setSelectedAsset(asset);
                  setApprovalStatus('PENDING');
                }}
                className={`px-3 py-1 text-xs font-mono font-semibold rounded-lg transition-all ${
                  selectedAsset === asset
                    ? 'bg-[#16A36A] text-[#E8F2EE] shadow-sm'
                    : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
                }`}
              >
                {asset}
              </button>
            ))}
          </div>

          {/* Timeframe Selector */}
          <div className="hidden sm:flex items-center gap-1 bg-[#101B20] p-1 rounded-xl border border-[#1A363E]">
            {(['M5', 'M15', 'H1', 'H4', 'D1'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-all ${
                  timeframe === tf
                    ? 'bg-[#168BFF] text-[#E8F2EE]'
                    : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* User Auth Action or Request Access */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-[#101B20] border border-[#1A363E] text-xs font-mono text-[#16A36A]">
                Authenticated
              </div>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-xl bg-[#E05252]/10 hover:bg-[#E05252]/20 border border-[#E05252]/30 text-[#E05252] text-xs font-bold transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('/register')}
              className="px-3.5 py-1.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold shadow-sm shadow-[#16A36A]/20 transition-all"
            >
              Register / Sign In
            </button>
          )}
        </div>
      </header>

      {/* Dashboard Body Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Chart and Technical Confluence Overlays (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Asset Info Strip */}
          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-mono text-[#E8F2EE]">{selectedAsset}</h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#16A36A]/15 text-[#16A36A] border border-[#16A36A]/30 font-semibold">
                  {assetDetails.bias}
                </span>
                <span className="text-xs font-mono text-[#A9BEB5]">{timeframe}</span>
              </div>
              <p className="text-xs text-[#A9BEB5] font-mono mt-0.5">{assetDetails.name}</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-[#E8F2EE]">{assetDetails.price}</span>
              <p className="text-xs font-mono text-[#16A36A]">{assetDetails.change} Session</p>
            </div>
          </div>

          {/* Interactive Chart Canvas */}
          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-4 purple-glow-box space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-[#A9BEB5]">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#168BFF]" />
                Structural Confluence View
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#16A36A]" />
                <span>Live Feed Emulated</span>
              </div>
            </div>

            {/* SVG Visual Candlestick & Concept Overlay */}
            <div className="relative h-64 sm:h-72 w-full bg-[#101B20] rounded-xl border border-[#1A363E] p-3 flex flex-col justify-between overflow-hidden">
              {/* Overlays legend tags */}
              <div className="z-10 flex flex-wrap gap-2 text-[10px] font-mono">
                <span className="bg-[#9560E8]/20 border border-[#9560E8]/40 text-[#E8F2EE] px-2 py-0.5 rounded">
                  Fair Value Gap (H1)
                </span>
                <span className="bg-[#168BFF]/20 border border-[#168BFF]/40 text-[#168BFF] px-2 py-0.5 rounded">
                  Liquidity Sweep Range
                </span>
                <span className="bg-[#16A36A]/20 border border-[#16A36A]/40 text-[#16A36A] px-2 py-0.5 rounded">
                  Bullish Order Block
                </span>
              </div>

              {/* Chart SVG */}
              <svg className="w-full h-full relative z-0" viewBox="0 0 600 220" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartFvg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#9560E8" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#9560E8" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid */}
                <line x1="0" y1="50" x2="600" y2="50" stroke="#1A363E" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="110" x2="600" y2="110" stroke="#1A363E" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="170" x2="600" y2="170" stroke="#1A363E" strokeWidth="1" strokeDasharray="4 4" />

                {/* Fair Value Gap Zone */}
                <rect x="250" y="70" width="180" height="50" fill="url(#chartFvg)" stroke="#9560E8" strokeWidth="1" strokeDasharray="2 2" />
                <text x="255" y="65" fill="#9560E8" fontSize="10" fontFamily="monospace">ICT Fair Value Gap</text>

                {/* Liquidity level */}
                <line x1="20" y1="160" x2="580" y2="160" stroke="#E69A36" strokeWidth="1" strokeDasharray="3 3" />
                <text x="30" y="155" fill="#E69A36" fontSize="9" fontFamily="monospace">Asian Session Low Swept</text>

                {/* Candlestick sequence */}
                {/* 1 */}
                <line x1="50" y1="80" x2="50" y2="140" stroke="#E05252" strokeWidth="1.5" />
                <rect x="44" y="90" width="12" height="35" fill="#E05252" rx="1" />
                {/* 2 */}
                <line x1="90" y1="110" x2="90" y2="175" stroke="#E05252" strokeWidth="1.5" />
                <rect x="84" y="120" width="12" height="42" fill="#E05252" rx="1" />
                {/* 3 sweep candle */}
                <line x1="130" y1="105" x2="130" y2="185" stroke="#16A36A" strokeWidth="1.5" />
                <rect x="124" y="110" width="12" height="30" fill="#16A36A" rx="1" />
                {/* 4 strong displacement */}
                <line x1="180" y1="75" x2="180" y2="145" stroke="#16A36A" strokeWidth="1.5" />
                <rect x="174" y="80" width="12" height="50" fill="#16A36A" rx="1" />
                {/* 5 */}
                <line x1="230" y1="65" x2="230" y2="115" stroke="#16A36A" strokeWidth="1.5" />
                <rect x="224" y="70" width="12" height="30" fill="#16A36A" rx="1" />
                {/* 6 pullback into FVG */}
                <line x1="280" y1="85" x2="280" y2="125" stroke="#E05252" strokeWidth="1.5" />
                <rect x="274" y="90" width="12" height="25" fill="#E05252" rx="1" />
                {/* 7 bounce */}
                <line x1="330" y1="60" x2="330" y2="110" stroke="#16A36A" strokeWidth="1.5" />
                <rect x="324" y="65" width="12" height="35" fill="#16A36A" rx="1" />
                {/* 8 continuation */}
                <line x1="380" y1="40" x2="380" y2="90" stroke="#16A36A" strokeWidth="1.5" />
                <rect x="374" y="45" width="12" height="35" fill="#16A36A" rx="1" />
                {/* 9 pause */}
                <line x1="430" y1="35" x2="430" y2="75" stroke="#E69A36" strokeWidth="1.5" />
                <rect x="424" y="40" width="12" height="20" fill="#E69A36" rx="1" />
                {/* 10 present */}
                <line x1="480" y1="20" x2="480" y2="65" stroke="#16A36A" strokeWidth="1.5" />
                <rect x="474" y="25" width="12" height="30" fill="#16A36A" rx="1" />

                {/* Target projection */}
                <line x1="486" y1="30" x2="570" y2="15" stroke="#168BFF" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx="570" cy="15" r="3" fill="#168BFF" />
              </svg>

              <div className="z-10 flex items-center justify-between text-[11px] font-mono text-[#A9BEB5] pt-1 border-t border-[#1A363E]">
                <span>CRT High: 2,654.00 | Low: 2,638.50</span>
                <span className="text-[#16A36A]">Market Regime: Trend Expansion</span>
              </div>
            </div>
          </div>

          {/* Economic News Calendar Bar */}
          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#E8F2EE] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#168BFF]" />
                Scheduled Macro Catalysts
              </span>
              <span className="text-[#A9BEB5]">Core 4 Tracking</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              <div className="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]">
                <span className="text-[#E05252] font-bold block text-[10px]">CPI INFLATION</span>
                <span className="text-[#E8F2EE] font-bold">Wed 12:30</span>
                <span className="text-[10px] text-[#A9BEB5] block mt-0.5">Gold / DXY</span>
              </div>
              <div className="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]">
                <span className="text-[#168BFF] font-bold block text-[10px]">PPI WHOLESALE</span>
                <span className="text-[#E8F2EE] font-bold">Thu 12:30</span>
                <span className="text-[10px] text-[#A9BEB5] block mt-0.5">Currencies</span>
              </div>
              <div className="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]">
                <span className="text-[#E05252] font-bold block text-[10px]">NFP PAYROLLS</span>
                <span className="text-[#E8F2EE] font-bold">Fri 12:30</span>
                <span className="text-[10px] text-[#A9BEB5] block mt-0.5">High Impact</span>
              </div>
              <div className="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]">
                <span className="text-[#9560E8] font-bold block text-[10px]">FOMC POLICY</span>
                <span className="text-[#E8F2EE] font-bold">Cycle Decision</span>
                <span className="text-[10px] text-[#A9BEB5] block mt-0.5">Market Wide</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Setup Action Card & Risk Management (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Mode switch: Setup vs Choppiness Demo */}
          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-2 flex gap-2">
            <button
              onClick={() => {
                setShowNoTradeDemo(false);
                setApprovalStatus('PENDING');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                !showNoTradeDemo
                  ? 'bg-[#16A36A] text-[#E8F2EE] shadow-sm'
                  : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Valid Setup Demo</span>
            </button>
            <button
              onClick={() => setShowNoTradeDemo(true)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                showNoTradeDemo
                  ? 'bg-[#E69A36] text-[#101B20] shadow-sm'
                  : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>'NO TRADE' Demo</span>
            </button>
          </div>

          {!showNoTradeDemo ? (
            /* AI Setup Card with Semi-Automated Approval Simulator */
            <div className="bg-[#152B30] border border-[#16A36A]/40 rounded-2xl p-5 purple-glow-box space-y-4">
              <div className="flex items-center justify-between border-b border-[#1A363E] pb-3">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#16A36A]/20 text-[#16A36A] border border-[#16A36A]/40 uppercase">
                  Pending Trader Review
                </span>
                <span className="text-xs font-mono text-[#A9BEB5]">Signal #842</span>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#E8F2EE]">
                    {selectedAsset} Bullish Opportunity
                  </h3>
                  <span className="text-xs font-mono text-[#168BFF] font-bold">R:R 1 : 2.8</span>
                </div>
                <p className="text-xs text-[#A9BEB5] mt-1 leading-relaxed">
                  Confluence detected: H1 Bullish Order Block + 15m Fair Value Gap fill following London sell-side liquidity purge.
                </p>
              </div>

              {/* Order Parameters */}
              <div className="grid grid-cols-3 gap-2 font-mono text-center">
                <div className="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]">
                  <span className="text-[10px] text-[#A9BEB5] block">Entry Level</span>
                  <span className="text-xs font-bold text-[#E8F2EE]">2,644.20</span>
                </div>
                <div className="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]">
                  <span className="text-[10px] text-[#E05252] block">Stop Loss</span>
                  <span className="text-xs font-bold text-[#E8F2EE]">2,639.80</span>
                </div>
                <div className="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]">
                  <span className="text-[10px] text-[#16A36A] block">Take Profit</span>
                  <span className="text-xs font-bold text-[#E8F2EE]">2,656.50</span>
                </div>
              </div>

              {/* Human Approval Action State */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-mono text-[#A9BEB5] flex items-center justify-between">
                  <span>Semi-Automated Workflow:</span>
                  <span className="font-bold text-[#E8F2EE]">Step 3: Trader Review</span>
                </div>

                {approvalStatus === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setApprovalStatus('APPROVED')}
                      className="flex-1 py-2.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#16A36A]/20 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Setup</span>
                    </button>
                    <button
                      onClick={() => setApprovalStatus('REJECTED')}
                      className="flex-1 py-2.5 rounded-xl bg-[#101B20] hover:bg-[#1A363E] text-[#E05252] border border-[#E05252]/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Setup</span>
                    </button>
                  </div>
                )}

                {approvalStatus === 'APPROVED' && (
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-[#16A36A]/15 border border-[#16A36A]/40 text-xs text-[#E8F2EE] space-y-1">
                      <p className="font-bold text-[#16A36A] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Trader Approval Granted
                      </p>
                      <p className="text-[11px] text-[#A9BEB5]">
                        Setup is now passed to the planned MT5 execution component for independent validation.
                      </p>
                    </div>
                    <button
                      onClick={() => setApprovalStatus('MT5_VALIDATED')}
                      className="w-full py-2.5 rounded-xl bg-[#168BFF] hover:bg-[#147bdc] text-[#E8F2EE] text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#168BFF]/25 transition-all"
                    >
                      <Workflow className="w-4 h-4" />
                      <span>Simulate MT5 Independent Validation</span>
                    </button>
                  </div>
                )}

                {approvalStatus === 'MT5_VALIDATED' && (
                  <div className="p-3.5 rounded-xl bg-[#168BFF]/15 border border-[#168BFF]/40 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[#168BFF] font-bold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        MT5 Client Validated (Simulation)
                      </span>
                      <span className="text-[10px] font-mono">Spread: 1.2 pips OK</span>
                    </div>
                    <p className="text-[11px] text-[#A9BEB5]">
                      Broker connection verified. Lot sizing matches local risk limits. (In future production release, order will transmit directly to your MT5 terminal).
                    </p>
                    <button
                      onClick={() => setApprovalStatus('PENDING')}
                      className="text-[11px] font-bold text-[#E8F2EE] underline hover:text-[#168BFF]"
                    >
                      Reset Demo
                    </button>
                  </div>
                )}

                {approvalStatus === 'REJECTED' && (
                  <div className="p-3 rounded-xl bg-[#E05252]/15 border border-[#E05252]/40 text-xs text-[#E8F2EE] space-y-2">
                    <p className="font-bold text-[#E05252] flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> Setup Declined by Trader
                    </p>
                    <p className="text-[11px] text-[#A9BEB5]">
                      Execution canceled. No instruction transmitted to MT5. Your capital remains untouched.
                    </p>
                    <button
                      onClick={() => setApprovalStatus('PENDING')}
                      className="text-[11px] font-bold text-[#E8F2EE] underline hover:text-[#168BFF]"
                    >
                      Reset Demo
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 'NO TRADE' Protection Demo Card */
            <div className="bg-[#152B30] border border-[#E69A36]/40 rounded-2xl p-5 purple-glow-box space-y-4">
              <div className="flex items-center justify-between border-b border-[#1A363E] pb-3">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#E69A36]/20 text-[#E69A36] border border-[#E69A36]/40 uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> NO TRADE SIGNAL
                </span>
                <span className="text-xs font-mono text-[#E69A36]">Protection Active</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#E8F2EE]">Capital Preservation Filter</h3>
                <p className="text-xs text-[#A9BEB5] mt-1 leading-relaxed">
                  Market conditions currently fail our institutional confluence requirement. The engine prevents impulsive trade entry when probability is low.
                </p>
              </div>

              <div className="bg-[#101B20] p-3 rounded-xl border border-[#1A363E] space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-[#A9BEB5]">Choppiness Index</span>
                  <span className="text-[#E69A36] font-bold">64.2 / 100 (High Noise)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A9BEB5]">Orderflow Alignment</span>
                  <span className="text-[#E05252] font-bold">Conflicted (M15 vs H4)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A9BEB5]">Economic Proximity</span>
                  <span className="text-[#E8F2EE]">FOMC within 2 hours</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#E69A36]/10 border border-[#E69A36]/30 text-xs text-[#A9BEB5]">
                <strong className="text-[#E8F2EE] block mb-1">Why NO TRADE is a feature:</strong>
                Amateur systems produce continuous trades to keep users engaged. PipPilotAi protects capital by rejecting substandard setups.
              </div>
            </div>
          )}

          {/* Integrated Risk Calculator */}
          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A363E] pb-3">
              <span className="text-xs font-mono font-bold text-[#E8F2EE] flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#16A36A]" />
                Live Risk Calculator
              </span>
              <span className="text-xs font-mono text-[#16A36A] font-bold">
                {calculatedLotSize} Lots
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#A9BEB5]">Account Size</span>
                  <span className="text-[#E8F2EE] font-bold">${accountBalance.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={100000}
                  step={5000}
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(Number(e.target.value))}
                  className="w-full accent-[#16A36A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="p-2 rounded-xl bg-[#101B20] border border-[#1A363E]">
                  <span className="text-[10px] text-[#A9BEB5] block">Risk Percent</span>
                  <span className="text-xs font-bold text-[#168BFF]">{riskPercent}%</span>
                </div>
                <div className="p-2 rounded-xl bg-[#101B20] border border-[#1A363E]">
                  <span className="text-[10px] text-[#A9BEB5] block">Risk ($)</span>
                  <span className="text-xs font-bold text-[#E05252]">${riskAmount.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
