import React, { useState } from 'react';
import { X, ShieldAlert, FileText, Mail, Send, CheckCircle2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BaseModal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#152B30] border border-[#16A36A]/30 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden purple-glow-box"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A363E] bg-[#101B20]/80">
          <h3 className="text-lg font-bold text-[#E8F2EE]">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A9BEB5] hover:text-[#E8F2EE] hover:bg-[#1A363E] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-[#A9BEB5] text-sm leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ContactModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setName('');
    setEmail('');
    setMessage('');
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleReset} title="Contact PipPilotAi Team">
      {submitted ? (
        <div className="text-center py-6 space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#16A36A]/20 text-[#16A36A] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-[#E8F2EE]">Inquiry Received</h4>
          <p className="text-xs text-[#A9BEB5]">
            Thank you for reaching out. A platform representative will review your message and reply to {email} as onboarding slots open.
          </p>
          <button
            onClick={handleReset}
            className="mt-4 px-5 py-2 rounded-xl bg-[#16A36A] text-[#E8F2EE] text-sm font-semibold hover:bg-[#148f5d] transition-colors"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-[#A9BEB5]">
            Have inquiries regarding PipPilotAi features, analysis frameworks, or upcoming access rounds? Send our team a note below.
          </p>
          <div>
            <label className="block text-xs font-medium text-[#E8F2EE] mb-1">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Trader"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] text-sm focus:outline-none focus:border-[#16A36A] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#E8F2EE] mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trader@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] text-sm focus:outline-none focus:border-[#16A36A] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#E8F2EE] mb-1">Message *</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What questions do you have about PipPilotAi?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] text-sm focus:outline-none focus:border-[#16A36A] transition-colors resize-none"
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#A9BEB5] hover:text-[#E8F2EE] hover:bg-[#101B20] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] flex items-center gap-2 shadow-lg shadow-[#16A36A]/20 transition-all"
            >
              <Send className="w-4 h-4" /> Send Message
            </button>
          </div>
        </form>
      )}
    </BaseModal>
  );
};

export const PrivacyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
  <BaseModal isOpen={isOpen} onClose={onClose} title="Privacy Policy Notice">
    <div className="space-y-3 text-xs leading-relaxed">
      <p className="font-semibold text-[#E8F2EE]">1. Public Stage Overview</p>
      <p>
        PipPilotAi is currently presented as an informational marketing and preview platform. In this initial stage, no personal trading accounts, broker credentials, or financial payment details are collected or processed.
      </p>
      <p className="font-semibold text-[#E8F2EE]">2. Information You Provide</p>
      <p>
        If you submit your email address to inquire about membership access or updates, that contact information is solely retained to inform you about verified platform onboarding. It is never sold, leased, or distributed to third-party marketing brokers.
      </p>
      <p className="font-semibold text-[#E8F2EE]">3. Future Authentication & MT5 Integration</p>
      <p>
        When semi-automated trading and MT5 execution modules become available, account credentials will be managed with strict encryption standards, and execution commands will require independent local validation by the trader.
      </p>
      <p className="font-semibold text-[#E8F2EE]">4. Contact & Inquiries</p>
      <p>
        For inquiries regarding privacy, data handling, or waitlist status, please contact the PipPilotAi administration via our contact desk.
      </p>
    </div>
  </BaseModal>
);

export const TermsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
  <BaseModal isOpen={isOpen} onClose={onClose} title="Terms and Conditions Notice">
    <div className="space-y-3 text-xs leading-relaxed">
      <p className="font-semibold text-[#E8F2EE]">1. Analytical Software Scope</p>
      <p>
        PipPilotAi provides algorithmic market intelligence, structural technical analysis (SMC, ICT, CRT), and disciplined risk calculation tools. PipPilotAi is an informational software tool and does not provide regulated financial or investment advice.
      </p>
      <p className="font-semibold text-[#E8F2EE]">2. Autonomous Trader Responsibility</p>
      <p>
        All trading decisions, order entries, risk thresholds, and capital allocations remain exclusively the responsibility of the individual trader. The platform does not guarantee profitability or prevent market losses.
      </p>
      <p className="font-semibold text-[#E8F2EE]">3. Planned Semi-Automated Execution</p>
      <p>
        Any planned MetaTrader 5 (MT5) execution features operate on a trader-approval workflow where the user retains the absolute right and duty to validate or cancel any trade before execution.
      </p>
      <p className="font-semibold text-[#E8F2EE]">4. Access Discretion</p>
      <p>
        Membership access to premium analysis modules is reviewed and granted at the administrator's discretion following manual verification.
      </p>
    </div>
  </BaseModal>
);
