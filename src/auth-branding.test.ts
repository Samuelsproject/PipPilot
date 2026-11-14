import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const templateDirectory = resolve(process.cwd(), 'docs/supabase-auth-email-templates');

describe('PipPilotAi email template drafts', () => {
  it('uses Supabase confirmation variables for account confirmation and email verification', () => {
    const template = readFileSync(resolve(templateDirectory, 'confirm-signup.html'), 'utf8');

    expect(template).toContain('PipPilotAi');
    expect(template).toContain('{{ .Email }}');
    expect(template).toContain('{{ .ConfirmationURL }}');
    expect(template).toContain('administrator review');
    expect(template).not.toContain('supabase.co');
    expect(template).not.toContain('service_role');
  });

  it('uses the official confirmation URL for password recovery', () => {
    const template = readFileSync(resolve(templateDirectory, 'reset-password.html'), 'utf8');

    expect(template).toContain('Reset your PipPilotAi password');
    expect(template).toContain('{{ .ConfirmationURL }}');
    expect(template).toContain('single-use');
    expect(template).not.toContain('supabase.co');
  });

  it('uses the new-email variable for optional email-change confirmation', () => {
    const template = readFileSync(resolve(templateDirectory, 'change-email.html'), 'utf8');

    expect(template).toContain('{{ .NewEmail }}');
    expect(template).toContain('{{ .ConfirmationURL }}');
    expect(template).toContain('PipPilotAi');
  });

  it('documents dashboard template names and the exact callback paths', () => {
    const guide = readFileSync(resolve(templateDirectory, 'README.md'), 'utf8');

    expect(guide).toContain('Authentication → Email Templates');
    expect(guide).toContain('/verify-email');
    expect(guide).toContain('/reset-password');
    expect(guide).toContain('do not');
  });
});
