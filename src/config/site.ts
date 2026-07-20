/**
 * site.ts — locale-independent site identity used to compose JSON-LD in
 * BaseLayout.astro. Locale-branched content (job title, service descriptions,
 * project descriptions) belongs in a `seo` block on your Dictionary type
 * instead — see src/i18n/types.ts and current56's own site.ts/BaseLayout.astro
 * for the worked pattern this was extracted from.
 *
 * This is the file to edit when rebranding: change every value below, retone
 * the three hues in src/styles/global.css's @theme block, and (per the design
 * contract in src/design-contract.test.ts) nothing else should need touching.
 */

export interface SiteAddress {
  streetAddress: string;
  addressLocality: string;
  postalCode: string;
  addressCountry: string;
}

export interface SiteIdentity {
  name: string;
  founderName: string;
  address: SiteAddress;
  vatId: string;
  areaServed: string[];
  logoPath: string;
  defaultOgImage: string;
  /** schema.org sameAs for the ProfessionalService entity */
  sameAs: string[];
  /** schema.org sameAs for the founder Person entity — may include more links */
  founderSameAs: string[];
  twitterHandle: string;
}

export const siteIdentity: SiteIdentity = {
  name: 'Your Company',
  founderName: 'Your Name',
  address: {
    streetAddress: 'Street 1',
    addressLocality: 'City',
    postalCode: '00000',
    addressCountry: 'DE',
  },
  vatId: '',
  areaServed: ['DE'],
  logoPath: '/logo.svg',
  defaultOgImage: '/og-image.jpg',
  sameAs: [],
  founderSameAs: [],
  twitterHandle: '',
};
