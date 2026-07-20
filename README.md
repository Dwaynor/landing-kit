# landing-kit

An Astro 5 + TypeScript + Tailwind v4 starter for building landing pages that
don't look AI-generated. Extracted from a production site
([current56.de](https://github.com/Dwaynor/current56)) after the design
system, motion layer, and security scaffolding had already been through
several real iterations — the goal here is that the next site starts from
that baseline instead of rediscovering it.

## What's included

- **OKLCH-only design tokens** (`src/styles/global.css`) — semantic color
  roles (light/dark/inverted surfaces, one accent), fluid type, self-hosted
  variable fonts (Hanken Grotesk, Bricolage Grotesque, JetBrains Mono).
- **An enforced anti-slop contract** (`src/design-contract.test.ts`), not just
  documentation — blocks hex/rgb/hsl colors, `border-radius`, `backdrop-filter`,
  Google Fonts CDN references, non-AVIF content images, and a banned-word list
  (`src/config/content-rules.ts`), repo-wide, as part of `npm run pipeline`.
- **A deferred motion layer** (`src/motion/{env,scroll,smooth}.ts`) — GSAP +
  ScrollTrigger with reduced-motion/reduced-data gating built in, Lenis smooth
  scroll that only activates on fine-pointer devices, a `registerScroll()`
  registry with a 4-second safety net so nothing stays permanently hidden if a
  script fails.
- **A hardened contact form API** (`src/pages/api/contact.ts` +
  `src/lib/mailer.ts`) — fail-closed origin check, `Sec-Fetch-Site` defense,
  rate limiting, honeypot, input validation, HTML-escaped email body. Mailer
  logic is isolated behind one function so you can swap providers without
  touching the route.
- **i18n scaffolding** (`src/i18n/`) — locale routing (default locale
  unprefixed, others under `/<code>/`), a slug-preserving language switcher
  pattern, DE/EN shipped as the worked example.
- **SEO/GEO basics** — `robots.txt` allows the major AI crawlers by name
  (GPTBot, ClaudeBot, PerplexityBot, etc.), `BaseLayout.astro` emits
  `ProfessionalService`/`WebSite`/`BreadcrumbList` JSON-LD from
  `src/config/site.ts`, sitemap with hreflang alternates.
- **Security headers** (`src/middleware.ts`) — CSP, HSTS, frame/content-type
  protections, applied in-app so they work in local dev too, not just behind
  a specific reverse proxy.
- **Coolify + Cloudflare deploy tooling** (documented below) — this is the
  stack it's proven on; adapt the Dockerfile/compose file if you deploy
  elsewhere.

## What's deliberately NOT included

This is a component catalog and infrastructure spine, not a finished landing
page. There's no fixed section flow (hero → services → proof → …) baked in —
real projects vary from a one-pager to a multi-section site, and forcing one
shape onto all of them was the mistake this starter is trying to avoid. Build
your page(s) from here using whatever sections the project actually needs.

## Quickstart

```bash
npm install
cp .env.example .env.local   # fill in contact-form credentials if you need the form
npm run dev
```

## The design contract

`npm run pipeline` (check → lint → test → build → audit) is the gate. The
parts worth knowing about:

- **OKLCH only.** No hex/rgb/hsl anywhere in `src/`. Edit colors via
  `src/styles/global.css`'s `@theme` block.
- **No border-radius / rounded-\* on anything, no backdrop-filter, no Google
  Fonts CDN.** These are the mechanical half of the anti-slop rules — the
  judgment-call half (generic layouts, filler copy, symmetrical AI-paragraph
  rhythm) isn't a regex; review for it the way you'd review any copy.
- **Banned words** (`src/config/content-rules.ts`) — DE + EN, each with a
  `reason` and a `hard`/`caution` severity. `hard` terms fail the build if they
  show up in `src/i18n/{de,en}.ts`.
- **AVIF only for content images**, via `<Image format="avif">` — the
  contract checks that every `@assets/*.jpg|.png` import gets rendered
  through it.

## Rebranding

Everything identity-related lives in two files:

- `src/config/site.ts` — name, founder, address, VAT, social links. Feeds
  `BaseLayout.astro`'s JSON-LD directly.
- `src/styles/global.css`'s `@theme` block — three hues drive the whole
  palette (light-surface neutral, dark-surface neutral, the one accent).

Nothing else should need touching for a straightforward rebrand — if you find
somewhere that does, it's probably a bug in this starter, not your project.

## Deploying

Ships a multi-stage `Dockerfile` (non-root user, `npm ci --ignore-scripts` +
explicit `sharp` rebuild for supply-chain hardening) and
`docker-compose.coolify.yml` for [Coolify](https://coolify.io/). If you use
the companion `deploy-paas` Claude Code skill, it automates Cloudflare DNS +
Coolify app creation + env sync from a `deploy.config.json` — see that skill's
own README for setup. Otherwise, `docker build` and point any container host
at port 4321, health-checked at `/api/health`.

## Credits

Extracted from [current56.de](https://github.com/Dwaynor/current56).
Fonts (Hanken Grotesk, Bricolage Grotesque, JetBrains Mono) are OFL-licensed —
see LICENSE.
