import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  resend: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: { auth: authMock },
  isSupabaseConfigured: true,
}));

import {
  formatAuthErrorMessage,
  loginUser,
  logoutUser,
  registerUser,
  requestPasswordReset,
  resendVerificationEmail,
  updateUserPassword,
} from './auth';

const validEmail = 'trader@example.com';
const validPassword = 'StrongPass1!';
const user = {
  id: 'user-1',
  email: validEmail,
  email_confirmed_at: null,
} as never;
const session = { access_token: 'test-access-token', user } as never;

describe('email and password authentication service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.signUp.mockResolvedValue({ data: { user, session: null }, error: null });
    authMock.signInWithPassword.mockResolvedValue({ data: { user, session }, error: null });
    authMock.signOut.mockResolvedValue({ error: null });
    authMock.resetPasswordForEmail.mockResolvedValue({ error: null });
    authMock.updateUser.mockResolvedValue({ data: { user }, error: null });
    authMock.resend.mockResolvedValue({ error: null });
  });

  it('registers with email and password and sends confirmation to the verification route', async () => {
    const result = await registerUser(' TRADER@example.com ', validPassword);

    expect(result.error).toBeNull();
    expect(result.requiresEmailVerification).toBe(true);
    expect(result.data?.session).toBeNull();
    expect(authMock.signUp).toHaveBeenCalledWith(expect.objectContaining({
      email: validEmail,
      password: validPassword,
      options: expect.objectContaining({
        emailRedirectTo: `${window.location.origin}/verify-email`,
      }),
    }));
  });

  it('validates signup input before making an authentication request', async () => {
    const invalidEmail = await registerUser('not-an-email', validPassword);
    const weakPassword = await registerUser(validEmail, 'weak');

    expect(invalidEmail.error).toMatch(/valid email/i);
    expect(weakPassword.error).toMatch(/password must be/i);
    expect(authMock.signUp).not.toHaveBeenCalled();
  });

  it('clears a session if Supabase returns one during registration', async () => {
    authMock.signUp.mockResolvedValue({ data: { user, session }, error: null });

    const result = await registerUser(validEmail, validPassword);

    expect(result.error).toBeNull();
    expect(result.data?.session).toBeNull();
    expect(authMock.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('returns a safe message for duplicate signup without exposing provider details', async () => {
    authMock.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error('User already registered at internal-project.supabase.co'),
    });

    const result = await registerUser(validEmail, validPassword);

    expect(result.error).toMatch(/could not create an account/i);
    expect(result.error).not.toContain('internal-project');
  });

  it('signs in with email and password and formats invalid credentials safely', async () => {
    const success = await loginUser(validEmail, validPassword);
    expect(success.data?.session).toBe(session);
    expect(authMock.signInWithPassword).toHaveBeenCalledWith({
      email: validEmail,
      password: validPassword,
    });

    authMock.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error('Invalid login credentials'),
    });
    const failure = await loginUser(validEmail, validPassword);
    expect(failure.error).toMatch(/invalid email or password/i);
  });

  it('requests recovery without revealing whether an email exists', async () => {
    authMock.resetPasswordForEmail.mockResolvedValue({
      error: new Error('User not found for recovery request'),
    });

    const result = await requestPasswordReset(validEmail);

    expect(result.error).toBeNull();
    expect(authMock.resetPasswordForEmail).toHaveBeenCalledWith(
      validEmail,
      { redirectTo: `${window.location.origin}/reset-password` },
    );
  });

  it('updates a password only after enforcing the shared password policy', async () => {
    const invalid = await updateUserPassword('short');
    expect(invalid.error).toMatch(/password must be/i);
    expect(authMock.updateUser).not.toHaveBeenCalled();

    const valid = await updateUserPassword(validPassword);
    expect(valid.error).toBeNull();
    expect(authMock.updateUser).toHaveBeenCalledWith({ password: validPassword });
  });

  it('resends verification only for a valid email address', async () => {
    const invalid = await resendVerificationEmail('bad');
    expect(invalid.error).toMatch(/valid email/i);
    expect(authMock.resend).not.toHaveBeenCalled();

    const valid = await resendVerificationEmail(validEmail);
    expect(valid.error).toBeNull();
    expect(authMock.resend).toHaveBeenCalledWith(expect.objectContaining({
      type: 'signup',
      email: validEmail,
      options: { emailRedirectTo: `${window.location.origin}/verify-email` },
    }));
  });

  it('signs out the current browser session locally', async () => {
    expect((await logoutUser()).error).toBeNull();
    expect(authMock.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('never returns raw Supabase project details in unexpected errors', () => {
    expect(formatAuthErrorMessage(new Error('failure at secret-ref.supabase.co'))).toMatch(/could not complete/i);
  });
});
