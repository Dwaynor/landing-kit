/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Azure AD tenant ID — for the default Microsoft Graph mailer in src/lib/mailer.ts */
  readonly MS_TENANT_ID: string;
  /** Azure AD app registration client ID */
  readonly MS_CLIENT_ID: string;
  /** Azure AD app registration client secret */
  readonly MS_CLIENT_SECRET: string;
  /** Contact form recipient mailbox */
  readonly CONTACT_EMAIL: string;
  /** Google Search Console site-ownership verification token (public by design) */
  readonly PUBLIC_GOOGLE_SITE_VERIFICATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
