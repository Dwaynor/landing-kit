/**
 * mailer.ts — email delivery for the contact form, isolated behind one function
 * so the API route (src/pages/api/contact.ts) doesn't need to change if you swap
 * providers. Ships with a Microsoft Graph API implementation (client-credentials
 * OAuth2 flow, no SMTP credentials to manage, EU-hostable) as a proven default —
 * swap sendContactEmail's body for Resend/Postmark/SES/etc. if you prefer.
 */

export interface ContactSubmission {
  name: string;
  email: string;
  company: string;
  position: string;
  message: string;
}

export interface MailerResult {
  ok: boolean;
  /** Present only on failure — safe to log, never expose to the client response. */
  errorDetail?: string;
}

/** Escape HTML to prevent XSS in the email body. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendContactEmail(submission: ContactSubmission): Promise<MailerResult> {
  const { name, email, company, position, message } = submission;

  // Must use process.env here, not import.meta.env — non-PUBLIC import.meta.env
  // vars are replaced with their build-time value by Vite, so if .env.production
  // isn't present during `docker build` they'd be undefined in the compiled
  // output. process.env is resolved at runtime from the container environment.
  const tenantId = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;
  const contactEmail = process.env.CONTACT_EMAIL;

  if (!tenantId || !clientId || !clientSecret || !contactEmail) {
    return { ok: false, errorDetail: 'Mailer credentials not configured' };
  }

  const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
    }),
  });

  if (!tokenRes.ok) {
    return { ok: false, errorDetail: `Graph token error: ${await tokenRes.text()}` };
  }

  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const sendRes = await fetch(`https://graph.microsoft.com/v1.0/users/${contactEmail}/sendMail`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        subject: `New contact form submission — ${name}${company ? ` (${company})` : ''}`,
        body: {
          contentType: 'HTML',
          content: `
            <h2>New contact form submission</h2>
            <table style="border-collapse:collapse;width:100%;max-width:500px;">
              <tr><td style="padding:8px 12px;font-weight:bold;vertical-align:top;">Name</td><td style="padding:8px 12px;">${escapeHtml(name)}</td></tr>
              <tr><td style="padding:8px 12px;font-weight:bold;vertical-align:top;">Email</td><td style="padding:8px 12px;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
              ${company ? `<tr><td style="padding:8px 12px;font-weight:bold;vertical-align:top;">Company</td><td style="padding:8px 12px;">${escapeHtml(company)}</td></tr>` : ''}
              ${position ? `<tr><td style="padding:8px 12px;font-weight:bold;vertical-align:top;">Position</td><td style="padding:8px 12px;">${escapeHtml(position)}</td></tr>` : ''}
              <tr><td style="padding:8px 12px;font-weight:bold;vertical-align:top;">Message</td><td style="padding:8px 12px;white-space:pre-wrap;">${escapeHtml(message)}</td></tr>
            </table>
          `,
        },
        toRecipients: [{ emailAddress: { address: contactEmail } }],
        replyTo: [{ emailAddress: { address: email, name } }],
      },
      saveToSentItems: true,
    }),
  });

  if (!sendRes.ok) {
    return {
      ok: false,
      errorDetail: `Graph sendMail error ${sendRes.status}: ${await sendRes.text()}`,
    };
  }

  return { ok: true };
}
