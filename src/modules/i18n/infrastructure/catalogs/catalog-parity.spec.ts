import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const CATALOGS_DIR = join(__dirname);
const LANGUAGES = ['en', 'vi'];

function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flattenKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

function loadLanguageKeys(lang: string): Set<string> {
  const dir = join(CATALOGS_DIR, lang);
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  const keys: string[] = [];
  for (const file of files) {
    const namespace = file.replace(/\.json$/, '');
    const content = JSON.parse(readFileSync(join(dir, file), 'utf8')) as Record<
      string,
      unknown
    >;
    keys.push(...flattenKeys(content, namespace));
  }
  return new Set(keys);
}

describe('catalog parity (SC-003)', () => {
  it('en and vi carry exactly the same key set', () => {
    const [en, vi] = LANGUAGES.map(loadLanguageKeys);

    const missingFromVi = [...en].filter((k) => !vi.has(k));
    const missingFromEn = [...vi].filter((k) => !en.has(k));

    expect(missingFromVi).toEqual([]);
    expect(missingFromEn).toEqual([]);
  });

  it('neither language is empty (sanity — parity of two empty sets would pass vacuously)', () => {
    const en = loadLanguageKeys('en');
    expect(en.size).toBeGreaterThan(0);
  });
});
