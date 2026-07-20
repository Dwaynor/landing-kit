/**
 * design-contract.test.ts — repo-wide, blocking checks for the mechanical
 * anti-slop rules. src/components/visual-upgrade.test.ts already checks several
 * of these against a fixed list of homepage components; this file checks the
 * same rules across all of src/ (including page components, layouts, and
 * src/motion/*.ts) so a new file can't quietly reintroduce a banned pattern.
 * Judgment-call rules (is this layout generic, is this copy filler) are not
 * here — those stay a human/agent review call, not a regex.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'node:fs';
import { bannedWords } from './config/content-rules';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function sourceFiles(extensions: string[]): string[] {
  const patterns = extensions.map((ext) => `src/**/*.${ext}`);
  return patterns
    .flatMap((pattern) => globSync(pattern, { cwd: ROOT }))
    .filter((f) => !f.endsWith('.test.ts') && !f.includes('node_modules'));
}

function readLines(file: string): string[] {
  return readFileSync(resolve(ROOT, file), 'utf-8').split('\n');
}

/** True if this line is fully a `//` comment (leading whitespace then `//`) —
 *  excludes prose *describing* a banned pattern from tripping the check on itself. */
function isFullLineComment(line: string): boolean {
  return /^\s*\/\//.test(line);
}

describe('Design contract — OKLCH only', () => {
  it('no hex/rgb/hsl color literals anywhere in src/', () => {
    const violations: string[] = [];
    for (const file of sourceFiles(['astro', 'ts', 'css'])) {
      const lines = readLines(file);
      lines.forEach((line, i) => {
        if (isFullLineComment(line)) return;
        if (/(?<!&)#[0-9a-fA-F]{3,8}\b/.test(line) && !/^\s*import\b/.test(line)) {
          violations.push(`${file}:${i + 1} (hex): ${line.trim()}`);
        }
        if (/\b(rgb|hsl)a?\s*\(/i.test(line)) {
          violations.push(`${file}:${i + 1} (rgb/hsl): ${line.trim()}`);
        }
      });
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });
});

describe('Design contract — anti-pattern blacklist', () => {
  it('no border-radius / rounded-* utilities anywhere in src/', () => {
    const violations: string[] = [];
    for (const file of sourceFiles(['astro', 'css'])) {
      const lines = readLines(file);
      lines.forEach((line, i) => {
        if (isFullLineComment(line)) return;
        if (/rounded-(?:sm|md|lg|xl|2xl|3xl|full)\b/.test(line) || /border-radius/.test(line)) {
          violations.push(`${file}:${i + 1}: ${line.trim()}`);
        }
      });
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });

  it('no backdrop-filter/backdrop-blur anywhere in src/', () => {
    const violations: string[] = [];
    for (const file of sourceFiles(['astro', 'css'])) {
      const content = readFileSync(resolve(ROOT, file), 'utf-8');
      if (content.includes('backdrop-filter') || content.includes('backdrop-blur')) {
        violations.push(file);
      }
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });

  it('no Google Fonts CDN references anywhere in src/', () => {
    const violations: string[] = [];
    for (const file of sourceFiles(['astro', 'ts', 'css'])) {
      const content = readFileSync(resolve(ROOT, file), 'utf-8');
      if (content.includes('fonts.googleapis.com') || content.includes('fonts.gstatic.com')) {
        violations.push(file);
      }
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });

  it('every imported .jpg/.jpeg/.png content image is rendered via <Image format="avif">', () => {
    const violations: string[] = [];
    for (const file of sourceFiles(['astro'])) {
      const content = readFileSync(resolve(ROOT, file), 'utf-8');
      const hasRasterImport = /from ['"]@assets\/[^'"]+\.(jpe?g|png)['"]/i.test(content);
      if (hasRasterImport && !content.includes('format="avif"')) {
        violations.push(file);
      }
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });
});

describe('Design contract — banned words', () => {
  it('no "hard" severity banned words in i18n dictionaries', () => {
    const violations: string[] = [];
    const hardTerms = bannedWords.filter((w) => w.severity === 'hard');
    const dictFiles = ['src/i18n/de.ts', 'src/i18n/en.ts'];
    for (const file of dictFiles) {
      const content = readFileSync(resolve(ROOT, file), 'utf-8');
      const locale = file.includes('/de.ts') ? 'de' : 'en';
      for (const word of hardTerms.filter((w) => w.locale === locale)) {
        // Word-boundary, case-insensitive: catches "Revolutionieren" and "revolutionieren".
        const re = new RegExp(`\\b${word.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (re.test(content)) {
          violations.push(
            `${relative(ROOT, resolve(ROOT, file))}: "${word.term}" (${word.reason})`,
          );
        }
      }
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });
});
