import { de } from './de';
import { en } from './en';
import { defaultLang, type Locale } from './ui';
import type { Dictionary } from './types';

const dictionaries: Record<Locale, Dictionary> = { de, en };

/** Resolve the active dictionary from Astro.currentLocale (falls back to DE). */
export function getDictionary(locale: string | undefined): Dictionary {
  return dictionaries[(locale as Locale) ?? defaultLang] ?? dictionaries[defaultLang];
}

/**
 * Swap the locale prefix on a path while preserving the rest of the URL, for the
 * language switcher. DE is unprefixed (prefixDefaultLocale: false); EN lives under /en/.
 */
export function localizePath(pathname: string, target: Locale): string {
  const stripped = pathname.replace(/^\/en\//, '/').replace(/^\/en$/, '/');
  if (target === 'en') {
    return stripped === '/' ? '/en/' : `/en${stripped}`;
  }
  return stripped;
}
