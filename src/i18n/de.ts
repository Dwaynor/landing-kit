import type { Dictionary } from './types';

export const de: Dictionary = {
  meta: {
    skipLink: 'Zum Inhalt springen',
    defaultDescription: 'Beschreibung hier einfügen.',
  },
  nav: {
    ariaMainNav: 'Hauptnavigation',
    ariaLogo: 'Zur Startseite',
    ariaMenuOpen: 'Menü öffnen',
    ariaMenuClose: 'Menü schließen',
  },
  footer: {
    copyright: (year: number) => `© ${year}`,
  },
};
