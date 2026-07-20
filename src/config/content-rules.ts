/**
 * content-rules.ts — single source of truth for the anti-AI-slop banned-word list.
 * Consumed by src/design-contract.test.ts (blocking check against src/i18n/*) and
 * available to any doc/tool that needs the canonical list. Add project-specific
 * terms here rather than scattering banned-word notes across docs — that's how
 * this list drifted into three disagreeing copies in the project this was
 * extracted from.
 */

export type BannedWordSeverity = 'hard' | 'caution';

export interface BannedWord {
  term: string;
  locale: 'de' | 'en';
  reason: string;
  /** 'hard' = never use. 'caution' = avoid unless the specific claim is proven/justified
   *  (e.g. "innovative" is fine paired with concrete proof, not as a bare adjective). */
  severity: BannedWordSeverity;
}

export const bannedWords: BannedWord[] = [
  // German
  { term: 'Revolutionieren', locale: 'de', reason: 'AI filler', severity: 'hard' },
  { term: 'revolutionär', locale: 'de', reason: 'AI filler', severity: 'hard' },
  { term: 'Synergie', locale: 'de', reason: 'Nobody says this in real life', severity: 'hard' },
  { term: 'synergetisch', locale: 'de', reason: 'Nobody says this in real life', severity: 'hard' },
  { term: 'Entfesseln', locale: 'de', reason: 'Marketing cliché', severity: 'hard' },
  { term: 'entfesselt', locale: 'de', reason: 'Marketing cliché', severity: 'hard' },
  {
    term: 'Nahtlos',
    locale: 'de',
    reason: 'Overused to the point of meaninglessness',
    severity: 'hard',
  },
  {
    term: 'nahtlose Integration',
    locale: 'de',
    reason: 'Overused to the point of meaninglessness',
    severity: 'hard',
  },
  { term: 'Wegweisend', locale: 'de', reason: 'Empty claim', severity: 'hard' },
  { term: 'bahnbrechend', locale: 'de', reason: 'Empty claim', severity: 'hard' },
  { term: 'Ganzheitlich', locale: 'de', reason: 'Consultant bingo', severity: 'hard' },
  { term: 'ganzheitlicher Ansatz', locale: 'de', reason: 'Consultant bingo', severity: 'hard' },
  { term: 'Innovativ', locale: 'de', reason: 'Prove it or don’t say it', severity: 'caution' },
  {
    term: 'Innovationsführer',
    locale: 'de',
    reason: 'Prove it or don’t say it',
    severity: 'caution',
  },
  { term: 'Nächste Generation', locale: 'de', reason: 'Tech buzzword', severity: 'hard' },
  { term: 'Transformieren', locale: 'de', reason: 'AI default verb', severity: 'hard' },
  { term: 'transformativ', locale: 'de', reason: 'AI default verb', severity: 'hard' },
  { term: 'Transformation', locale: 'de', reason: 'AI default verb', severity: 'hard' },
  {
    term: 'Mehrwert schaffen',
    locale: 'de',
    reason: 'Say what the actual value is instead',
    severity: 'hard',
  },
  { term: 'Mehrwert', locale: 'de', reason: 'Use a concrete benefit instead', severity: 'caution' },
  {
    term: 'Skalierbar',
    locale: 'de',
    reason: 'Vague — state the actual capacity/limit instead',
    severity: 'hard',
  },
  {
    term: 'Skalierbarkeit',
    locale: 'de',
    reason: 'Vague — state the actual capacity/limit instead',
    severity: 'hard',
  },
  {
    term: 'Optimiert',
    locale: 'de',
    reason: 'Overused — use the specific verb instead',
    severity: 'caution',
  },
  {
    term: 'optimieren',
    locale: 'de',
    reason: 'Overused — use the specific verb instead',
    severity: 'caution',
  },
  { term: 'Zukunftssicher', locale: 'de', reason: 'Empty claim', severity: 'hard' },
  { term: 'zukunftsorientiert', locale: 'de', reason: 'Empty claim', severity: 'hard' },
  {
    term: 'Maßgeschneidert',
    locale: 'de',
    reason: 'Only true if genuinely custom-built',
    severity: 'caution',
  },
  { term: 'Exzellenz', locale: 'de', reason: 'Empty claim', severity: 'hard' },
  { term: 'Excellence', locale: 'de', reason: 'Empty claim', severity: 'hard' },

  // English
  { term: 'Revolutionize', locale: 'en', reason: 'AI filler', severity: 'hard' },
  { term: 'Synergy', locale: 'en', reason: 'Nobody says this in real life', severity: 'hard' },
  { term: 'Unleash', locale: 'en', reason: 'Marketing cliché', severity: 'hard' },
  {
    term: 'Seamless',
    locale: 'en',
    reason: 'Overused to the point of meaninglessness',
    severity: 'hard',
  },
  { term: 'Groundbreaking', locale: 'en', reason: 'Empty claim', severity: 'hard' },
  { term: 'Holistic', locale: 'en', reason: 'Consultant bingo', severity: 'hard' },
  { term: 'Innovative', locale: 'en', reason: 'Prove it or don’t say it', severity: 'caution' },
  { term: 'Next-Gen', locale: 'en', reason: 'Tech buzzword', severity: 'hard' },
  { term: 'Transform', locale: 'en', reason: 'AI default verb', severity: 'hard' },
  {
    term: 'Create value',
    locale: 'en',
    reason: 'Say what the actual value is instead',
    severity: 'hard',
  },
  // The "delve" vocabulary — words real people rarely use in this register.
  { term: 'delve', locale: 'en', reason: 'AI filler word', severity: 'hard' },
  { term: 'tapestry', locale: 'en', reason: 'AI filler word', severity: 'hard' },
  { term: 'beacon', locale: 'en', reason: 'AI filler word', severity: 'hard' },
  { term: 'testament', locale: 'en', reason: 'AI filler word', severity: 'hard' },
  { term: 'leverage', locale: 'en', reason: 'AI filler word — use a plain verb', severity: 'hard' },
  { term: 'utilize', locale: 'en', reason: 'AI filler word — "use" instead', severity: 'hard' },
  { term: 'facilitate', locale: 'en', reason: 'AI filler word', severity: 'hard' },
  { term: 'spearhead', locale: 'en', reason: 'AI filler word', severity: 'hard' },
  { term: 'foster', locale: 'en', reason: 'AI filler word', severity: 'hard' },
];

export function bannedWordsForLocale(locale: 'de' | 'en'): BannedWord[] {
  return bannedWords.filter((w) => w.locale === locale);
}
