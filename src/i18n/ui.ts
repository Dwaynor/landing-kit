/**
 * ui.ts — i18n language registry.
 * DE is the default, unprefixed locale (astro.config.mjs: prefixDefaultLocale: false).
 */

export const languages = {
  de: 'Deutsch',
  en: 'English',
} as const;

export type Locale = keyof typeof languages;

export const defaultLang: Locale = 'de';

export const locales: Locale[] = ['de', 'en'];
