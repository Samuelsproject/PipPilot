import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardPreviewPage } from './DashboardPreviewPage';
import { WORKSPACE_NAV_ITEMS } from './workspace/WorkspaceLayout';

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: useAuthMock }));
vi.mock('@workspace/api-client-react', async (importOriginal) => ({
  ...await importOriginal<typeof import('@workspace/api-client-react')>(),
  useAnalyzeTrading: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}));

describe('workspace authentication gate', () => {
  afterEach(() => cleanup());

  it('does not render workspace content while the session is unresolved', () => {
    useAuthMock.mockReturnValue({
      user: null,
      isLoading: true,
      emailVerified: false,
      isApproved: false,
    });

    render(<DashboardPreviewPage currentRoute="/app" onNavigate={vi.fn()} />);

    expect(screen.getByText('Verifying workspace session...')).toBeTruthy();
    expect(screen.queryByText('Dashboard Overview')).toBeNull();
  });

  it('requires sign-in before any workspace route can render', () => {
    useAuthMock.mockReturnValue({
      user: null,
      isLoading: false,
      emailVerified: false,
      isApproved: false,
    });

    render(<DashboardPreviewPage currentRoute="/app/admin" onNavigate={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Authentication Required' })).toBeTruthy();
    expect(screen.queryByText('Administrator Membership Management')).toBeNull();
  });

  it('requires verified email without treating verification as active membership', () => {
    useAuthMock.mockReturnValue({
      user: { email: 'member@example.com' },
      isLoading: false,
      emailVerified: false,
      isApproved: false,
    });

    render(<DashboardPreviewPage currentRoute="/app/trading" onNavigate={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Email Verification Required' })).toBeTruthy();
    expect(screen.queryByText('Trading Workspace')).toBeNull();
  });

  it.each(WORKSPACE_NAV_ITEMS.filter(({ requiresApproval }) => requiresApproval))(
    'blocks direct navigation to $route without server-verified active membership',
    ({ route }) => {
      useAuthMock.mockReturnValue({
        user: { id: 'member-1', email: 'member@example.com' },
        isLoading: false,
        emailVerified: true,
        membershipStatus: 'pending',
        membershipAccessVerified: true,
        isApproved: false,
        userRole: 'trader',
        isDesignatedAdmin: false,
        refreshSession: vi.fn(),
      });

      render(<DashboardPreviewPage currentRoute={route} onNavigate={vi.fn()} />);

      expect(screen.getByTestId('membership-denial')).toBeTruthy();
      expect(screen.queryByTestId('membership-verification-required')).toBeNull();
    },
  );

  it.each([
    ['suspended', 'MT5 Connections Access Is Suspended'],
    ['expired', 'MT5 Connections Access Has Been Revoked'],
  ] as const)('explains %s access on a direct feature route', (status, heading) => {
    useAuthMock.mockReturnValue({
      user: { id: 'member-1', email: 'member@example.com' },
      isLoading: false,
      emailVerified: true,
      membershipStatus: status,
      membershipAccessVerified: true,
      isApproved: false,
      userRole: 'trader',
      isDesignatedAdmin: false,
      refreshSession: vi.fn(),
    });

    render(<DashboardPreviewPage currentRoute="/app/mt5" onNavigate={vi.fn()} />);

    expect(screen.getByRole('heading', { name: heading })).toBeTruthy();
    expect(screen.getByTestId('membership-denial').textContent).toContain(
      status === 'suspended' ? 'membership is suspended' : 'expired or been revoked',
    );
  });

  it.each(WORKSPACE_NAV_ITEMS.filter(({ requiresApproval }) => requiresApproval))(
    'renders $route only after the server verifies active membership',
    ({ route }) => {
      useAuthMock.mockReturnValue({
        user: { id: 'member-1', email: 'member@example.com' },
        isLoading: false,
        emailVerified: true,
        membershipStatus: 'active',
        membershipAccessVerified: true,
        isApproved: true,
        userRole: 'trader',
        isDesignatedAdmin: false,
        refreshSession: vi.fn(),
      });

      render(<DashboardPreviewPage currentRoute={route} onNavigate={vi.fn()} />);

      expect(screen.queryByTestId('membership-denial')).toBeNull();
      expect(screen.queryByTestId('membership-verification-required')).toBeNull();
    },
  );

  it('fails closed while the membership check is unavailable', () => {
    useAuthMock.mockReturnValue({
      user: { id: 'member-1', email: 'member@example.com' },
      isLoading: false,
      emailVerified: true,
      membershipStatus: 'active',
      membershipAccessVerified: false,
      membershipAccessLoading: false,
      membershipAccessError: 'Membership service unavailable.',
      isApproved: false,
      userRole: 'trader',
      isDesignatedAdmin: false,
      refreshSession: vi.fn(),
    });

    render(<DashboardPreviewPage currentRoute="/app/signals" onNavigate={vi.fn()} />);

    expect(screen.getByTestId('membership-verification-required').textContent).toContain(
      'Membership service unavailable.',
    );
    expect(screen.queryByText('Signal History & Outcome Log')).toBeNull();
  });
});
