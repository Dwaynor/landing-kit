/**
 * types.ts — shared shape for every locale dictionary. Both de.ts and en.ts are
 * checked against this interface, so a missing translation key is a build-time
 * TypeScript error, not a silent locale mix-up in production.
 *
 * This starter ships only the fields every site needs regardless of shape
 * (skip link, nav, footer). Add page/section-specific fields here as you build —
 * see README.md for the pattern (locale-branched copy lives in the dictionary,
 * locale-independent facts live in src/config/site.ts, following
 * src/components/FAQ.astro's JSON-LD generation as the reference example).
 */

export interface Dictionary {
  meta: {
    skipLink: string;
    defaultDescription: string;
  };
  nav: {
    ariaMainNav: string;
    ariaLogo: string;
    ariaMenuOpen: string;
    ariaMenuClose: string;
  };
  footer: {
    copyright: (_year: number) => string;
  };
}
