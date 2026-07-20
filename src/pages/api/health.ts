import type { APIRoute } from 'astro';

/**
 * GET /api/health
 * Lightweight liveness check for the Coolify healthcheck — avoids triggering
 * a full homepage SSR render (i18n dictionary, fonts) every 30s.
 */
export const prerender = false;

export const GET: APIRoute = () => {
  return new Response(JSON.stringify({ status: 'ok' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
