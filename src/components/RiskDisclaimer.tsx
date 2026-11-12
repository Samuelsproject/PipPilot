import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const RiskDisclaimer: React.FC = () => {
  return (
    <section className="py-10 bg-[#101B20] text-[#E8F2EE] border-t border-[#152B30]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 rounded-2xl bg-[#152B30]/60 border border-[#E69A36]/30 flex flex-col sm:flex-row items-start gap-4">
          <div className="p-2 rounded-xl bg-[#E69A36]/20 text-[#E69A36] shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-2 text-xs text-[#A9BEB5] leading-relaxed">
            <h4 className="text-sm font-bold text-[#E8F2EE] flex items-center gap-2">
              Responsible Trading & Risk Disclosure
            </h4>
            <p>
              Trading foreign exchange, commodities (including gold), indices, and leveraged contracts involves substantial financial risk and is not suitable for all investors. High leverage can work against you as well as for you. Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite.
            </p>
            <p>
              PipPilotAi provides software intelligence, algorithmic market analysis, and analytical calculation tools. The platform does not guarantee trading profits, eliminate financial losses, or offer individualized investment advice. Trading signals are analytical suggestions derived from mathematical and structural market frameworks, not assurances of future market direction. Users remain solely and exclusively responsible for all trading decisions, order executions, and financial outcomes. Past performance is no guarantee of future results.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
