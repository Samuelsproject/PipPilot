import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NavigationRoute } from '../types';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { ResetPasswordPage } from './ResetPasswordPage';
import { VerifyEmailPage } from './VerifyEmailPage';

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: useAuthMock }));

const defaultAuth = () => ({
  login: vi.fn().mockResolvedValue({ data: null, error: null }),
  register: vi.fn().mockResolvedValue({ data: null, error: null }),
  logout: vi.fn().mockResolvedValue(undefined),
  sendPasswordReset: vi.fn().mockResolvedValue({ data: null, error: null }),
  updatePassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
  resendVerification: vi.fn().mockResolvedValue({ data: null, error: null }),
  user: null,
  session: null,
  isLoading: false,
  isConfigured: true,
  emailVerified: false,
  isRecoverySession: false,
  refreshSession: vi.fn().mockResolvedValue(undefined),
});

describe('PipPilotAi authentication screens', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    window.sessionStorage.clear();
    useAuthMock.mockReturnValue(defaultAuth());
  });
  afterEach(() => cleanup());

  it('shows the exact sign-in heading, toggles password visibility and reports failures', async () => {
    const auth = defaultAuth();
    auth.login.mockResolvedValue({ data: null, error: 'Invalid email or password.' });
    useAuthMock.mockReturnValue(auth);
    const onNavigate = vi.fn();
    render(<LoginPage onNavigate={onNavigate} />);

    expect(screen.getByRole('heading', { name: 'Sign in to PipPilotAi' })).toBeTruthy();
    const password = screen.getByLabelText('Password') as HTMLInputElement;
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password.type).toBe('text');

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'member@example.com' } });
    fireEvent.change(password, { target: { value: 'WrongPass1!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(await screen.findByText('Invalid email or password.')).toBeTruthy();
    expect(onNavigate).not.toHaveBeenCalledWith('/app');
  });

  it('sends a successful registration directly to sign-in with a verification notice', async () => {
    const auth = defaultAuth();
    auth.register.mockResolvedValue({ data: { user: null, session: null }, error: null });
    useAuthMock.mockReturnValue(auth);
    const onNavigate = vi.fn();
    render(
      <RegisterPage
        onNavigate={onNavigate}
        onOpenPrivacy={vi.fn()}
        onOpenTerms={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Create your PipPilotAi account' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Create a strong password'), { target: { value: 'StrongPass1!' } });
    fireEvent.change(screen.getByPlaceholderText('Repeat your password'), { target: { value: 'StrongPass1!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account & Verify Email' }));

    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('/login'));
    expect(window.sessionStorage.getItem('pippilot:registration-complete')).toBe('1');
    render(<LoginPage onNavigate={onNavigate} />);
    expect((await screen.findByRole('status')).textContent).toContain(
      'Your PipPilotAi account was created. Sign in after verifying your email if verification is required.',
    );
  });

  it('uses a generic password recovery confirmation', async () => {
    const auth = defaultAuth();
    useAuthMock.mockReturnValue(auth);
    render(<ForgotPasswordPage onNavigate={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Reset your PipPilotAi password' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'unknown@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Recovery Link' }));

    expect(await screen.findByText(/if a PipPilotAi account matches/i)).toBeTruthy();
    expect(screen.queryByText(/account does not exist/i)).toBeNull();
  });

  it('rejects direct reset access without a recovery session and accepts a completed recovery', async () => {
    const noRecoveryAuth = defaultAuth();
    useAuthMock.mockReturnValue(noRecoveryAuth);
    const onNavigate = vi.fn();
    const { unmount } = render(<ResetPasswordPage onNavigate={onNavigate} />);
    expect(await screen.findByRole('heading', { name: 'PipPilotAi recovery link expired' })).toBeTruthy();
    unmount();

    const recoveryAuth = {
      ...defaultAuth(),
      session: { access_token: 'recovery-token' },
      isRecoverySession: true,
    };
    useAuthMock.mockReturnValue(recoveryAuth);
    render(<ResetPasswordPage onNavigate={onNavigate} />);
    expect(screen.getByRole('heading', { name: 'Choose a new PipPilotAi password' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'StrongPass1!' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'StrongPass1!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save New Password' }));
    expect(await screen.findByRole('heading', { name: 'PipPilotAi password updated' })).toBeTruthy();
    expect(recoveryAuth.updatePassword).toHaveBeenCalledWith('StrongPass1!');
  });

  it('does not report verification success based only on callback tokens', async () => {
    const auth = defaultAuth();
    auth.refreshSession.mockResolvedValue(undefined);
    useAuthMock.mockReturnValue(auth);
    window.history.replaceState({}, '', '/verify-email#access_token=placeholder&type=signup');

    render(<VerifyEmailPage onNavigate={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: 'Verify your PipPilotAi account' })).toBeTruthy();
    expect(screen.queryByText('PipPilotAi account verified')).toBeNull();
    expect(auth.refreshSession).toHaveBeenCalled();
  });

  it('shows an expired verification-link message for Supabase callback errors', async () => {
    useAuthMock.mockReturnValue(defaultAuth());
    window.history.replaceState({}, '', '/verify-email?error_code=otp_expired');

    render(<VerifyEmailPage onNavigate={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: 'PipPilotAi verification link expired' })).toBeTruthy();
  });

  it('uses PipPilotAi branding after successful email verification', async () => {
    useAuthMock.mockReturnValue({
      ...defaultAuth(),
      user: { email: 'member@example.com' },
      emailVerified: true,
    });

    render(<VerifyEmailPage onNavigate={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: 'PipPilotAi account verified' })).toBeTruthy();
  });
});
