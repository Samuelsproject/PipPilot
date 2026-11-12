import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Mail,
  Send,
} from 'lucide-react';
import { FAQ_ITEMS } from '../../data/workspaceData';
import { useAuth } from '../../context/AuthContext';

export const HelpSupportPage: React.FC = () => {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      {/* Platform Guidance */}
      <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 purple-glow-box space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#16A36A]" />
          <h2 className="text-base sm:text-lg font-extrabold text-[#E8F2EE] purple-glow-text">
            Platform Guidance & Semi-Automated Workflow
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1">
            <span className="font-mono text-[#168BFF] font-bold block">01. Multi-Timeframe Scan</span>
            <p className="text-[#A9BEB5]">
              Market structure is evaluated across D1, H4, H1, and M15 using SMC, ICT, and CRT rules.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1">
            <span className="font-mono text-[#9560E8] font-bold block">02. Capital Shield Check</span>
            <p className="text-[#A9BEB5]">
              Choppiness and CPI/PPI/NFP/FOMC proximity filter out low-probability setups as NO TRADE.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1">
            <span className="font-mono text-[#16A36A] font-bold block">03. Human Review</span>
            <p className="text-[#A9BEB5]">
              Every valid setup enters Trader Review where you retain final Approve or Reject control.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1">
            <span className="font-mono text-[#E69A36] font-bold block">04. Planned MT5 Bridge</span>
            <p className="text-[#A9BEB5]">
              Independent spread and risk checks run before order transmission (currently in development).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FAQs */}
        <div className="lg:col-span-7 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-[#E8F2EE] flex items-center gap-2 border-b border-[#1A363E] pb-3">
            <HelpCircle className="w-4 h-4 text-[#168BFF]" />
            <span>Frequently Asked Questions</span>
          </h3>

          <div className="space-y-2.5">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={item.q}
                  className="rounded-xl bg-[#101B20] border border-[#1A363E] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs font-semibold text-[#E8F2EE]"
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#16A36A] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#A9BEB5] shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3.5 pt-1 text-xs text-[#A9BEB5] leading-relaxed border-t border-[#1A363E]/60">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact / Support Interface */}
        <div className="lg:col-span-5 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#E8F2EE] flex items-center gap-2 border-b border-[#1A363E] pb-3">
            <Mail className="w-4 h-4 text-[#16A36A]" />
            <span>Contact / Support Desk</span>
          </h3>

          {submitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#16A36A]/20 text-[#16A36A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#E8F2EE]">Support Note Prepared</h4>
              <p className="text-xs text-[#A9BEB5]">
                Your inquiry for <span className="font-mono text-[#E8F2EE]">{user?.email}</span> has been recorded locally in this preview.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setSubject('');
                  setMessage('');
                }}
                className="px-4 py-2 rounded-xl bg-[#16A36A] text-[#E8F2EE] text-xs font-bold"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#E8F2EE] mb-1">
                  Account Email
                </label>
                <input
                  type="text"
                  readOnly
                  value={user?.email ?? ''}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#101B20]/70 border border-[#1A363E] text-[#A9BEB5] font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#E8F2EE] mb-1">
                  Topic / Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Membership Approval / Risk Settings"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] focus:outline-none focus:border-[#16A36A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#E8F2EE] mb-1">
                  Message *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe how the PipPilotAi team can assist..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] focus:outline-none focus:border-[#16A36A] resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Submit Support Request</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
