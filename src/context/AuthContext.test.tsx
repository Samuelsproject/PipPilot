import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { supabaseAuthMock, authServiceMock, workspaceAccessQueryMock } = vi.hoisted(() => ({
  supabaseAuthMock: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  workspaceAccessQueryMock: vi.fn(),
  authServiceMock: {
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    logoutUser: vi.fn(),
    requestPasswordReset: vi.fn(),
    updateUserPassword: vi.fn(),
    resendVerificationEmail: vi.fn(),
  },
}));

vi.mock('../lib/supabase', () => ({
  supabase: { auth: supabaseAuthMock },
  isSupabaseConfigured: true,
}));
vi.mock('../services/auth', () => authServiceMock);
vi.mock('@workspace/api-client-react', () => ({
  useGetWorkspaceAccess: workspaceAccessQueryMock,
}));

import { AuthProvider, useAuth } from './AuthContext';

let authListener: ((event: string, session: unknown) => void) | undefined;

function AuthProbe() {
  const auth = useAuth();
  return (
    <div>
      <p data-testid="auth-state">{auth.isLoading ? 'loading' : auth.user?.email ?? 'signed-out'}</p>
      <p data-testid="recovery-state">{auth.isRecoverySession ? 'recovery' : 'normal'}</p>
      <p data-testid="membership-state">{auth.emailVerified ? `${auth.membershipStatus}:${auth.isApproved}` : 'unverified'}</p>
      <p data-testid="approved-state">{auth.isApproved ? 'approved' : 'not-approved'}</p>
      <p data-testid="admin-state">{auth.isAdmin ? 'admin' : 'not-admin'}</p>
      <p data-testid="membership-access-check">{auth.membershipAccessVerified ? 'verified' : 'unverified'}</p>
      <p data-testid="membership-access-error">{auth.membershipAccessError ?? 'none'}</p>
      {!auth.isLoading && auth.user && <p>Protected content</p>}
      <button onClick={() => void auth.login('member@example.com', 'StrongPass1!')}>Sign in test</button>
      <button onClick={() => void auth.logout()}>Sign out test</button>
    </div>
  );
}

const confirmedUser = {
  id: 'user-1',
  email: 'member@example.com',
  email_confirmed_at: '2026-01-01T00:00:00.000Z',
  app_metadata: { membership_status: 'pending' },
} as never;
const testSession = { access_token: 'test-token', user: confirmedUser } as never;

describe('AuthContext session lifecycle', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    authListener = undefined;
    supabaseAuthMock.getSession.mockResolvedValue({ data: { session: null }, error: null });
    workspaceAccessQueryMock.mockReturnValue({
      data: undefined,
      error: null,
      isSuccess: false,
      isError: false,
      isLoading: false,
      isFetching: false,
    });
    supabaseAuthMock.onAuthStateChange.mockImplementation((callback: typeof authListener) => {
      authListener = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    authServiceMock.loginUser.mockResolvedValue({
      data: { user: confirmedUser, session: testSession },
      error: null,
    });
    authServiceMock.logoutUser.mockResolvedValue({ data: null, error: null });
  });
  afterEach(() => cleanup());

  it('keeps protected content hidden until the initial session lookup finishes', async () => {
    let resolveSession: ((value: unknown) => void) | undefined;
    supabaseAuthMock.getSession.mockReturnValue(new Promise((resolve) => { resolveSession = resolve; }));

    render(<AuthProvider><AuthProbe /></AuthProvider>);
    expect(screen.getByTestId('auth-state').textContent).toBe('loading');
    expect(screen.queryByText('Protected content')).toBeNull();

    await act(async () => {
      resolveSession?.({ data: { session: testSession }, error: null });
    });
    expect(await screen.findByText('Protected content')).toBeTruthy();
    expect(screen.getByTestId('auth-state').textContent).toBe('member@example.com');
    expect(screen.getByTestId('membership-state').textContent).toBe('pending:false');
  });

  it('clears an invalid or expired stored session instead of exposing protected content', async () => {
    supabaseAuthMock.getSession.mockResolvedValue({
      data: { session: null },
      error: new Error('refresh token expired'),
    });

    render(<AuthProvider><AuthProbe /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('auth-state').textContent).toBe('signed-out'));
    expect(screen.queryByText('Protected content')).toBeNull();
  });

  it('updates state on login and sign-out and marks recovery callback sessions', async () => {
    render(<AuthProvider><AuthProbe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('auth-state').textContent).toBe('signed-out'));

    fireEvent.click(screen.getByRole('button', { name: 'Sign in test' }));
    expect(await screen.findByText('Protected content')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Sign out test' }));
    await waitFor(() => expect(screen.getByTestId('auth-state').textContent).toBe('signed-out'));
    expect(screen.queryByText('Protected content')).toBeNull();

    act(() => authListener?.('PASSWORD_RECOVERY', testSession));
    expect(await screen.findByTestId('recovery-state')).toHaveProperty('textContent', 'recovery');
    expect(window.sessionStorage.getItem('pippilot:recovery-session')).toBe('1');
  });

  it('uses the server-verified membership state instead of a stale session claim', async () => {
    supabaseAuthMock.getSession.mockResolvedValue({ data: { session: testSession }, error: null });
    workspaceAccessQueryMock.mockReturnValue({
      data: { userId: 'user-1', membershipStatus: 'active' },
      error: null,
      isSuccess: true,
      isError: false,
      isLoading: false,
      isFetching: false,
    });

    render(<AuthProvider><AuthProbe /></AuthProvider>);

    await waitFor(() => {
      expect(screen.getByTestId('membership-state').textContent).toBe('active:true');
    });
    expect(screen.getByTestId('membership-access-check').textContent).toBe('verified');
    const queryOptions = workspaceAccessQueryMock.mock.calls.at(-1)?.[0];
    expect(queryOptions.query.refetchInterval).toBe(30_000);
    expect(queryOptions.query.refetchOnWindowFocus).toBe(true);
  });

  it('recognizes a server-reported suspension even when the session claim says pending', async () => {
    supabaseAuthMock.getSession.mockResolvedValue({ data: { session: testSession }, error: null });
    workspaceAccessQueryMock.mockReturnValue({
      data: undefined,
      error: {
        status: 403,
        data: {
          code: 'MEMBERSHIP_SUSPENDED',
          error: 'Membership is suspended. Contact support for help.',
          membershipStatus: 'suspended',
        },
      },
      isSuccess: false,
      isError: true,
      isLoading: false,
      isFetching: false,
    });

    render(<AuthProvider><AuthProbe /></AuthProvider>);

    await waitFor(() => {
      expect(screen.getByTestId('membership-state').textContent).toBe('suspended:false');
    });
    expect(screen.getByTestId('membership-access-check').textContent).toBe('verified');
  });

  it('does not treat a stale active claim as verified when the server rejects email verification', async () => {
    const staleActiveSession = {
      access_token: 'test-token',
      user: {
        id: 'user-1',
        email: 'pippilotaiadmin@gmail.com',
        email_confirmed_at: '2026-01-01T00:00:00.000Z',
        app_metadata: { membership_status: 'active', role: 'admin' },
      },
    } as never;
    supabaseAuthMock.getSession.mockResolvedValue({
      data: { session: staleActiveSession },
      error: null,
    });
    workspaceAccessQueryMock.mockReturnValue({
      data: undefined,
      error: {
        status: 403,
        data: {
          code: 'EMAIL_UNVERIFIED',
          error: 'Verify your email address before entering the workspace.',
          membershipStatus: 'active',
        },
      },
      isSuccess: false,
      isError: true,
      isLoading: false,
      isFetching: false,
    });

    render(<AuthProvider><AuthProbe /></AuthProvider>);

    await waitFor(() => {
      expect(screen.getByTestId('membership-state').textContent).toBe('unverified');
    });
    expect(screen.getByTestId('approved-state').textContent).toBe('not-approved');
    expect(screen.getByTestId('admin-state').textContent).toBe('not-admin');
  });

  it('fails closed when the membership service cannot verify access', async () => {
    supabaseAuthMock.getSession.mockResolvedValue({ data: { session: testSession }, error: null });
    workspaceAccessQueryMock.mockReturnValue({
      data: undefined,
      error: { status: 503, data: { error: 'Membership access could not be verified.' } },
      isSuccess: false,
      isError: true,
      isLoading: false,
      isFetching: false,
    });

    render(<AuthProvider><AuthProbe /></AuthProvider>);

    await waitFor(() => {
      expect(screen.getByTestId('membership-access-error').textContent).toBe(
        'Membership access could not be verified.',
      );
    });
    expect(screen.getByTestId('membership-state').textContent).toBe('pending:false');
    expect(screen.getByTestId('membership-access-check').textContent).toBe('unverified');
  });
});
