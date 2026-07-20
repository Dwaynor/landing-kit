import type { APIRoute } from 'astro';
import { sendContactEmail } from '@/lib/mailer';

/**
 * POST /api/contact
 * Receives contact form submissions and emails them via src/lib/mailer.ts.
 * Security layers: honeypot, origin validation, input length limits,
 * server-side rate limiting, security response headers.
 */
export const prerender = false;

// ---------------------------------------------------------------------------
// Security headers applied to every response from this endpoint
// ---------------------------------------------------------------------------
const SECURITY_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// ---------------------------------------------------------------------------
// In-memory rate limiter: 3 submissions per IP per 15 minutes.
// NOTE: in-memory means per-process — if you deploy multiple replicas behind
// a load balancer, each replica has its own counter and the effective limit
// scales with replica count. Fine for a single-instance deploy; move to a
// shared store (Redis, KV) if you scale out horizontally.
// ---------------------------------------------------------------------------
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

// Clean up expired entries every 30 minutes to prevent a memory leak.
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, entry] of rateLimit) {
      if (now > entry.resetAt) rateLimit.delete(ip);
    }
  },
  30 * 60 * 1000,
);

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------
function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: SECURITY_HEADERS,
  });
}

function successResponse(): Response {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: SECURITY_HEADERS,
  });
}

// ---------------------------------------------------------------------------
// Allowed origins for CSRF protection — TODO: set to your real production
// domain(s). See astro.config.mjs's security.checkOrigin comment for why this
// app-level check exists instead of relying solely on Astro's built-in one.
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = ['https://www.example.com', 'https://example.com'];

export const POST: APIRoute = async ({ request }) => {
  try {
    // --- Origin validation (CSRF protection) ---
    // Fail-closed: a missing Origin header is rejected, not silently allowed.
    // Real browsers send Origin on every POST (including same-origin, plain
    // HTML form submissions), so this doesn't affect legitimate traffic — it
    // only blocks requests crafted to omit the header to dodge this check.
    const origin = request.headers.get('origin');
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      // eslint-disable-next-line no-console
      console.error('[contact] rejected: origin missing or not allowed:', origin ?? '(none)');
      return errorResponse(403, 'Invalid request.');
    }

    // --- Defense-in-depth: reject explicit cross-site fetches ---
    // Sec-Fetch-Site is sent by modern browsers and can't be spoofed by page
    // content. Only reject on an explicit "cross-site" value — absence (older
    // browsers, some non-browser clients) is not itself treated as suspicious,
    // since Origin above is already the primary, more widely-supported check.
    const secFetchSite = request.headers.get('sec-fetch-site');
    if (secFetchSite === 'cross-site') {
      // eslint-disable-next-line no-console
      console.error('[contact] rejected: Sec-Fetch-Site was cross-site');
      return errorResponse(403, 'Invalid request.');
    }

    // --- Server-side rate limiting ---
    const clientIp =
      request.headers.get('cf-connecting-ip') ??
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      'unknown';

    if (!checkRateLimit(clientIp)) {
      return errorResponse(429, 'Too many requests. Please try again later.');
    }

    const formData = await request.formData();

    // --- Honeypot check — if filled, it's a bot ---
    const honeypot = formData.get('website_url');
    if (honeypot) {
      // Return success silently — do not alert the bot.
      return successResponse();
    }

    const name = formData.get('name')?.toString().trim() ?? '';
    const email = formData.get('email')?.toString().trim() ?? '';
    const company = formData.get('company')?.toString().trim() ?? '';
    const position = formData.get('position')?.toString().trim() ?? '';
    const message = formData.get('message')?.toString().trim() ?? '';

    // --- Validate required fields ---
    if (!name || !email || !message) {
      return errorResponse(400, 'Please fill in all required fields.');
    }

    // --- Input length validation ---
    if (name.length < 2 || name.length > 100) {
      return errorResponse(400, 'Name must be between 2 and 100 characters.');
    }
    if (email.length > 254) {
      return errorResponse(400, 'Email address is too long.');
    }
    if (message.length < 10 || message.length > 2000) {
      return errorResponse(400, 'Message must be between 10 and 2000 characters.');
    }
    if (company && company.length > 200) {
      return errorResponse(400, 'Company name is too long.');
    }
    if (position && position.length > 200) {
      return errorResponse(400, 'Position is too long.');
    }

    // --- Basic email format check ---
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse(400, 'Please enter a valid email address.');
    }

    const result = await sendContactEmail({ name, email, company, position, message });
    if (!result.ok) {
      // eslint-disable-next-line no-console
      console.error('[contact] mailer error:', result.errorDetail);
      return errorResponse(500, 'Could not send message. Please try again or email us directly.');
    }

    return successResponse();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[contact] Unexpected error:', err);
    return errorResponse(500, 'An unexpected error occurred.');
  }
};
