import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { supabaseAuthMock, authServiceMock } = vi.hoisted(() => ({
  supabaseAuthMock: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
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

import { AuthProvider, useAuth } from './AuthContext';

let authListener: ((event: string, session: unknown) => void) | undefined;

function AuthProbe() {
  const auth = useAuth();
  return (
    <div>
      <p data-testid="auth-state">{auth.isLoading ? 'loading' : auth.user?.email ?? 'signed-out'}</p>
      <p data-testid="recovery-state">{auth.isRecoverySession ? 'recovery' : 'normal'}</p>
      <p data-testid="membership-state">{auth.emailVerified ? `${auth.membershipStatus}:${auth.isApproved}` : 'unverified'}</p>
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
});
