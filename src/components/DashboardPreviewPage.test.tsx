import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardPreviewPage } from './DashboardPreviewPage';

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: useAuthMock }));

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
});
