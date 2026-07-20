import type { Dictionary } from './types';

export const en: Dictionary = {
  meta: {
    skipLink: 'Skip to content',
    defaultDescription: 'Insert description here.',
  },
  nav: {
    ariaMainNav: 'Main navigation',
    ariaLogo: 'Go to homepage',
    ariaMenuOpen: 'Open menu',
    ariaMenuClose: 'Close menu',
  },
  footer: {
    copyright: (year: number) => `© ${year}`,
  },
};
