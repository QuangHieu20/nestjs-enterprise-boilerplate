import { Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { ITranslator } from '@modules/i18n/application/ports/translator.interface';
import type { SupportedLanguage } from '@modules/i18n/domain/constants/i18n.constants';

const MISSING_KEY_FALLBACK = 'common.internal_error';

/**
 * Neither of nestjs-i18n's own missing-key modes satisfies FR-018: the
 * default returns the raw key to the caller, and `throwOnMissingKey: true`
 * turns a miss into a thrown I18nError (a 500, even for what should stay a
 * 409). This wrapper detects the miss itself and substitutes the generic
 * message, so `throwOnMissingKey` stays `false` in the module config.
 */
@Injectable()
export class NestI18nTranslator implements ITranslator {
  private readonly logger = new Logger(NestI18nTranslator.name);

  constructor(private readonly i18n: I18nService) {}

  translate(
    key: string,
    lang: SupportedLanguage,
    args?: Record<string, unknown>,
  ): string {
    const result: unknown = this.i18n.translate(key, { lang, args });

    if (result === key) {
      this.logger.error(`Missing i18n key: "${key}"`);
      if (key === MISSING_KEY_FALLBACK) {
        // The fallback message itself is missing from the catalog — nothing
        // left to substitute. Surface something rather than loop.
        return 'Internal server error';
      }
      return this.i18n.translate(MISSING_KEY_FALLBACK, { lang });
    }

    return result as string;
  }
}
