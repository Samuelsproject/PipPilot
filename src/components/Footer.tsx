import React from 'react';
import { Compass, ShieldCheck, Mail, FileText, ExternalLink, ArrowUp } from 'lucide-react';
import { NavigationRoute } from '../types';

interface FooterProps {
  onNavigate: (route: NavigationRoute, hash?: string) => void;
  onOpenContact: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenContact,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0D161A] text-[#A9BEB5] border-t border-[#152B30] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Brand & Description (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#16A36A] via-[#168BFF] to-[#9560E8] p-[1.5px]">
                <div className="w-full h-full bg-[#101B20] rounded-[10px] flex items-center justify-center">
                  <Compass className="w-4 h-4 text-[#16A36A]" />
                </div>
              </div>
              <span className="font-extrabold text-lg tracking-tight text-[#E8F2EE]">
                PipPilot<span className="text-[#16A36A]">Ai</span>
              </span>
            </div>
            <p className="text-xs text-[#A9BEB5] max-w-sm leading-relaxed">
              Institutional-grade market intelligence, Smart Money Concepts, and disciplined risk management. PipPilotAi equips traders with clear confluences and semi-automated oversight.
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs text-[#16A36A]">
              <ShieldCheck className="w-4 h-4" />
              <span>Disciplined Execution • Human Authorization First</span>
            </div>
          </div>

          {/* Navigation Links (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8F2EE]">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('/', '#features')}
                  className="hover:text-[#E8F2EE] transition-colors"
                >
                  Platform Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/', '#how-it-works')}
                  className="hover:text-[#E8F2EE] transition-colors"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/', '#about')}
                  className="hover:text-[#E8F2EE] transition-colors"
                >
                  About PipPilotAi
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/app')}
                  className="text-[#168BFF] hover:underline transition-colors flex items-center gap-1"
                >
                  Dashboard Preview (/app)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/register')}
                  className="text-[#16A36A] font-semibold hover:underline transition-colors"
                >
                  Request Platform Access
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Inquiries (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8F2EE]">
              Compliance & Contact
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onOpenContact}
                  className="hover:text-[#E8F2EE] transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-[#168BFF]" />
                  <span>Contact PipPilotAi Team</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenPrivacy}
                  className="hover:text-[#E8F2EE] transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-[#16A36A]" />
                  <span>Privacy Policy Notice</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTerms}
                  className="hover:text-[#E8F2EE] transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-[#9560E8]" />
                  <span>Terms and Conditions Notice</span>
                </button>
              </li>
            </ul>
            <p className="text-[11px] text-[#A9BEB5]/80 pt-1">
              Public informational release. No live trading credentials or payments processed on this marketing page.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#152B30] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#A9BEB5]">
          <p>© {new Date().getFullYear()} PipPilotAi. All rights reserved.</p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 text-xs text-[#A9BEB5] hover:text-[#E8F2EE] transition-colors"
            aria-label="Back to top"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
