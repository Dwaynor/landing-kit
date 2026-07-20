import { defineMiddleware } from 'astro:middleware';

/**
 * Astro SSR middleware — security headers for all responses.
 *
 * Applied server-side to every response (pages + API routes) rather than left to
 * reverse-proxy config, so headers apply in local development too and the project
 * stays portable across hosting platforms.
 */
export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();

  // --- Security headers ---
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-Robots-Tag', 'all');

  // HSTS — some CDNs/edges set this too, but defense-in-depth at origin.
  // 2 years max-age, include subdomains.
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');

  // CSP — strict policy; no external resources loaded.
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      'upgrade-insecure-requests',
    ].join('; '),
  );

  return response;
});
