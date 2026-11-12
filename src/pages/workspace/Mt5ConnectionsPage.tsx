import React, { useState } from 'react';
import { AlertTriangle, Plug, ServerOff, ShieldCheck, Workflow } from 'lucide-react';

export const Mt5ConnectionsPage: React.FC = () => {
  const [accountMode, setAccountMode] = useState<'DEMO' | 'LIVE'>('DEMO');
  const [brokerServer, setBrokerServer] = useState('');
  const [accountLogin, setAccountLogin] = useState('');
  const [savedPreviewNotice, setSavedPreviewNotice] = useState(false);

  const handleSaveConfigPreview = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedPreviewNotice(true);
  };

  return (
    <div className="space-y-6">
      {/* Explicit Development Notice Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#152B30] border border-[#E69A36]/45 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#E69A36] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h2 className="text-sm font-bold text-[#E8F2EE]">
            MT5 Integration In Development — Not Connected
          </h2>
          <p className="text-[#A9BEB5] leading-relaxed">
            Actual MetaTrader 5 terminal connectivity and local execution bridge validation are currently under development and have not been implemented or tested yet. No broker credentials are transmitted or stored on a live execution server from this interface.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Connection & Execution Bridge Status */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 purple-glow-box space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A363E] pb-3">
              <span className="text-xs font-mono font-bold text-[#E8F2EE] flex items-center gap-1.5">
                <Plug className="w-4 h-4 text-[#168BFF]" />
                Bridge & Terminal Status
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E69A36]/20 text-[#E69A36]">
                DISCONNECTED
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] flex items-center justify-between">
                <span className="text-[#A9BEB5]">MT5 Terminal Link</span>
                <span className="text-[#E05252] font-bold flex items-center gap-1">
                  <ServerOff className="w-3.5 h-3.5" /> Offline
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] flex items-center justify-between">
                <span className="text-[#A9BEB5]">Execution Bridge</span>
                <span className="text-[#E69A36] font-bold">In Development</span>
              </div>
              <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] flex items-center justify-between">
                <span className="text-[#A9BEB5]">Selected Mode</span>
                <span
                  className={`font-bold ${
                    accountMode === 'DEMO' ? 'text-[#168BFF]' : 'text-[#16A36A]'
                  }`}
                >
                  {accountMode} MODE
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8F2EE] flex items-center gap-1.5">
              <Workflow className="w-4 h-4 text-[#16A36A]" />
              Planned 4-Step Execution Guardrail
            </h3>
            <p className="text-xs text-[#A9BEB5] leading-relaxed">
              Once built, the MT5 bridge will verify broker spread, slippage tolerance, and local risk caps independently after you explicitly approve a signal.
            </p>
          </div>
        </div>

        {/* Right: Account Connection Interface Preview */}
        <div className="lg:col-span-7 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A363E] pb-3">
            <div>
              <h3 className="text-base font-bold text-[#E8F2EE]">
                Account Connection Interface (Preview)
              </h3>
              <p className="text-xs text-[#A9BEB5]">
                Demo/Live mode selection and planned terminal pairing layout
              </p>
            </div>

            <div className="flex bg-[#101B20] p-1 rounded-xl border border-[#1A363E]">
              {(['DEMO', 'LIVE'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAccountMode(mode)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                    accountMode === mode
                      ? mode === 'DEMO'
                        ? 'bg-[#168BFF] text-[#E8F2EE]'
                        : 'bg-[#16A36A] text-[#E8F2EE]'
                      : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSaveConfigPreview} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#E8F2EE] mb-1.5">
                Broker Server Name
              </label>
              <input
                type="text"
                value={brokerServer}
                onChange={(e) => {
                  setBrokerServer(e.target.value);
                  setSavedPreviewNotice(false);
                }}
                placeholder="e.g. BrokerName-Demo01"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] text-sm font-mono focus:outline-none focus:border-[#168BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#E8F2EE] mb-1.5">
                MT5 Account Login ID
              </label>
              <input
                type="text"
                value={accountLogin}
                onChange={(e) => {
                  setAccountLogin(e.target.value);
                  setSavedPreviewNotice(false);
                }}
                placeholder="e.g. 50129482"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] text-sm font-mono focus:outline-none focus:border-[#168BFF]"
              />
            </div>

            {savedPreviewNotice && (
              <div className="p-3 rounded-xl bg-[#101B20] border border-[#168BFF]/40 text-xs text-[#168BFF]">
                Interface preview noted ({accountMode} mode). No live MT5 connection was attempted because the execution bridge is still under development.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-[#A9BEB5] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#16A36A]" />
                No passwords transmitted in preview stage
              </span>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold transition-colors"
              >
                Validate Interface Layout
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
