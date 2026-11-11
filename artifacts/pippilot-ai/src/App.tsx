import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/pages/home';
import { WorkspacePlaceholder } from '@/pages/workspace-placeholder';
import { WorkspaceLayout } from '@/layouts/workspace-layout';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <WorkspaceLayout>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/trading" component={() => <WorkspacePlaceholder page="trading" />} />
          <Route path="/strategies" component={() => <WorkspacePlaceholder page="strategies" />} />
          <Route path="/news" component={() => <WorkspacePlaceholder page="news" />} />
          <Route path="/risk" component={() => <WorkspacePlaceholder page="risk" />} />
          <Route path="/connections" component={() => <WorkspacePlaceholder page="connections" />} />
          <Route path="/history" component={() => <WorkspacePlaceholder page="history" />} />
          <Route path="/backtesting" component={() => <WorkspacePlaceholder page="backtesting" />} />
          <Route path="/settings" component={() => <WorkspacePlaceholder page="settings" />} />
          <Route path="/help" component={() => <WorkspacePlaceholder page="help" />} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </WorkspaceLayout>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
