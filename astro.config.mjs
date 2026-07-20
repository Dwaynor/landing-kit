// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.example.com', // TODO: set to your real production domain

  // Astro's built-in CSRF check (security.checkOrigin) is disabled here because it
  // rejects same-origin POSTs behind a reverse proxy that terminates TLS and forwards
  // over plain HTTP internally (Coolify/Traefik is one such setup) — the client's
  // Origin header (https://...) never matches Astro's perceived request URL
  // (http://...) in that topology. See withastro/astro#12851, #16945 — not specific
  // to any one proxy. src/pages/api/contact.ts's own ALLOWED_ORIGINS check provides
  // equivalent CSRF protection for the one route that needs it, so this is safe, not
  // a security regression. If you are NOT behind a TLS-terminating reverse proxy,
  // you can likely remove this override and rely on Astro's built-in check instead —
  // verify a real form submission works in your deployment before removing it.
  security: {
    checkOrigin: false,
  },

  vite: {
    plugins: [tailwindcss()],
  },

  // Trailing slash: always — ensures canonical URLs and sitemap URLs match. Without
  // this, sitemap emits /page/ but canonical emits /page, causing Google Search
  // Console "duplicate"/"alternate page" coverage warnings.
  trailingSlash: 'always',

  integrations: [
    sitemap({
      // Reciprocal hreflang alternates per URL, generated from the /en/ prefix.
      // Update locales here if you use different codes / add more languages.
      i18n: {
        defaultLocale: 'de',
        locales: { de: 'de-DE', en: 'en-US' },
      },
      serialize(item) {
        item.lastmod = new Date().toISOString();
        const path = new URL(item.url).pathname.replace(/^\/en\//, '/').replace(/^\/en$/, '/');
        // Generic default: homepage highest priority, everything else equal.
        // Customize per-path priority/changefreq once your page shape is fixed —
        // current56's version, for reference, weighted its services/projects pages
        // at 0.8 and its contact page at 0.6.
        if (path === '/') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        } else {
          item.priority = 0.5;
          item.changefreq = 'monthly';
        }
        return item;
      },
    }),
  ],

  // Server output with Node adapter.
  // Pages opt into static generation with `export const prerender = true`.
  // API routes use `export const prerender = false`.
  output: 'server',
  adapter: node({ mode: 'standalone' }),

  // Image optimization via Sharp.
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },

  // i18n: default locale at root (unprefixed, stable URLs), others under /<code>/.
  // DE/EN shipped as the worked example — add/remove locale codes as needed and
  // mirror the change in src/i18n/{ui.ts, de.ts, en.ts}.
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
