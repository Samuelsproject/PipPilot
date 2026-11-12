import React from 'react';
import { RefreshCw } from 'lucide-react';
import { NavigationRoute, WorkspaceRoute } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  WORKSPACE_NAV_ITEMS,
  WorkspaceLayout,
} from './workspace/WorkspaceLayout';
import {
  PendingApprovalGuard,
  WorkspaceAccessGate,
} from './workspace/WorkspaceAccessGate';
import { WorkspaceDashboardPage } from '../pages/workspace/WorkspaceDashboardPage';
import { TradingPage } from '../pages/workspace/TradingPage';
import { StrategiesPage } from '../pages/workspace/StrategiesPage';
import { NewsIntelligencePage } from '../pages/workspace/NewsIntelligencePage';
import { RiskManagementPage } from '../pages/workspace/RiskManagementPage';
import { Mt5ConnectionsPage } from '../pages/workspace/Mt5ConnectionsPage';
import { SignalHistoryPage } from '../pages/workspace/SignalHistoryPage';
import { BacktestingPage } from '../pages/workspace/BacktestingPage';
import { SettingsPage } from '../pages/workspace/SettingsPage';
import { HelpSupportPage } from '../pages/workspace/HelpSupportPage';

interface DashboardPreviewPageProps {
  currentRoute?: WorkspaceRoute;
  onNavigate: (route: NavigationRoute) => void;
}

export const DashboardPreviewPage: React.FC<DashboardPreviewPageProps> = ({
  currentRoute = '/app',
  onNavigate,
}) => {
  const { user, isLoading, emailVerified, isApproved } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#101B20] text-[#E8F2EE] flex items-center justify-center p-6 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#152B30] border border-[#1A363E] text-xs font-mono text-[#A9BEB5]">
          <RefreshCw className="w-4 h-4 text-[#16A36A] animate-spin" />
          <span>Verifying workspace session...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated visitors must not access protected workspace routes
  if (!user) {
    return (
      <WorkspaceAccessGate
        mode="unauthenticated"
        attemptedRoute={currentRoute}
        onNavigate={onNavigate}
      />
    );
  }

  // Unverified accounts must verify email before entering workspace
  if (!emailVerified) {
    return (
      <WorkspaceAccessGate
        mode="unverified"
        attemptedRoute={currentRoute}
        onNavigate={onNavigate}
      />
    );
  }

  const activeNav =
    WORKSPACE_NAV_ITEMS.find((item) => item.route === currentRoute) ??
    WORKSPACE_NAV_ITEMS[0];

  const renderWorkspacePage = () => {
    // Pending users must not gain premium/protected trading access
    if (activeNav.requiresApproval && !isApproved) {
      return (
        <PendingApprovalGuard
          featureName={activeNav.label}
          onNavigate={onNavigate}
        />
      );
    }

    switch (currentRoute) {
      case '/app/trading':
        return <TradingPage />;
      case '/app/strategies':
        return <StrategiesPage />;
      case '/app/news':
        return <NewsIntelligencePage />;
      case '/app/risk':
        return <RiskManagementPage />;
      case '/app/mt5':
        return <Mt5ConnectionsPage />;
      case '/app/signals':
        return <SignalHistoryPage />;
      case '/app/backtesting':
        return <BacktestingPage />;
      case '/app/settings':
        return <SettingsPage onNavigate={onNavigate} />;
      case '/app/support':
        return <HelpSupportPage />;
      case '/app':
      default:
        return <WorkspaceDashboardPage onNavigate={onNavigate} />;
    }
  };

  return (
    <WorkspaceLayout currentRoute={currentRoute} onNavigate={onNavigate}>
      {renderWorkspacePage()}
    </WorkspaceLayout>
  );
};
