import type { SupportedLanguage } from '@modules/i18n/domain/constants/i18n.constants';

export interface ITranslator {
  /**
   * Resolves `key` to text in `lang`. A key missing from every catalog never
   * throws and never returns the raw key — it falls back to the generic
   * message and logs the miss (FR-018).
   */
  translate(
    key: string,
    lang: SupportedLanguage,
    args?: Record<string, unknown>,
  ): string;
}
