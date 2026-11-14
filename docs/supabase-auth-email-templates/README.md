# PipPilotAi Supabase authentication email templates

These HTML templates are prepared for manual installation in the Supabase dashboard. They are not automatically deployed, and no live Supabase settings have been changed.

## Templates and dashboard locations

Open the Supabase project dashboard and go to **Authentication → Email Templates**:

| Supabase template | Subject | File |
| --- | --- | --- |
| Confirm sign up | Confirm your PipPilotAi account | `confirm-signup.html` |
| Reset password | Reset your PipPilotAi password | `reset-password.html` |
| Change email address (optional) | Confirm your new email for PipPilotAi | `change-email.html` |

Supabase uses **Confirm sign up** for the new-account email verification flow; there is not a second separate confirmation template to install. The optional change-email template is only needed if email changes are enabled for users.

Each template uses Supabase’s `{{ .ConfirmationURL }}` variable for the signed confirmation link. The application supplies the appropriate redirect target:

- Sign-up and verification resend: `/verify-email`
- Password recovery: `/reset-password`

The link resolves to the route on the origin where the request was made. Do not replace `{{ .ConfirmationURL }}` with a hand-built token URL or hardcode a project reference in the email.

## URL Configuration

In **Authentication → URL Configuration**:

- Set **Site URL** to the verified production app origin once it is supplied. The production deployment is not currently available, so its origin is intentionally not guessed.
- Add the exact production allow-list entries `<production-origin>/verify-email` and `<production-origin>/reset-password` after the origin is confirmed.
- Keep the Site URL set to production. Add the development preview callback URLs as exact allow-list entries rather than replacing the Site URL or adding broad wildcards.

Current development preview callbacks:

- `https://52eb8dd1-7273-4b33-ae51-5f8c07ba837d-00-17icrpxlasupa.spock.replit.dev/verify-email`
- `https://52eb8dd1-7273-4b33-ae51-5f8c07ba837d-00-17icrpxlasupa.spock.replit.dev/reset-password`

Development preview URLs can change if the Replit development domain changes. Refresh the exact entries if that happens.

## Sender identity and SMTP

The repository contains no SMTP host, sender address, sender name, or Supabase email-template configuration. The current live sender and SMTP status must be checked in the Supabase dashboard.

These are separate values:

- **Supabase project name**: an internal dashboard label.
- **Project reference and API URL**: technical identifiers used to reach the Supabase project; never use them as the customer-facing product name.
- **Sender display name**: the name recipients see. Set this to **PipPilotAi**.
- **Sender email address**: a real address on a sending domain you control and verify. The owner must choose and supply it; this project does not invent one.
- **Custom SMTP provider**: the service that delivers the messages. The provider supplies the SMTP host, port, username, password, and encryption requirements.

Supabase’s default email service is for testing and has recipient and rate restrictions. Current Supabase documentation says it only sends to project team-authorized addresses, has no delivery SLA, and is currently limited to two messages per hour; these limits can change. For customer-facing delivery, configure custom SMTP in the project’s Authentication SMTP settings. Verify the sender domain and its DNS records with the chosen provider first. The dashboard fields include sender name (`smtp_sender_name`) and sender email (`smtp_admin_email`). Enter SMTP credentials directly in the dashboard’s protected settings; do not put them in these templates, source code, or chat.

Before setup, the owner must choose a provider and provide its SMTP host, port, username, password, supported encryption mode, and verified sender email address. Do not send the password through chat.

## Security and membership wording

The confirmation template says verification confirms the address only. It does not promise membership approval or full access. Membership and administrator roles remain server-managed. No administrator initialization, live user changes, or email sends were performed while preparing these templates.

## Supabase documentation

- [Email templates and template variables](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Redirect URL allow-list](https://supabase.com/docs/guides/auth/redirect-urls)
