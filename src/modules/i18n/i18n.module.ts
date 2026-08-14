import { join } from 'path';
import { Global, Module, OnModuleInit } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from '@shared/presentation/interceptors/response.interceptor';
import { GlobalExceptionFilter } from '@shared/presentation/filters/global-exception.filter';
import { ConfigService } from '@nestjs/config';
import {
  I18nModule as NestI18nModule,
  I18nJsonLoader,
  I18nService,
} from 'nestjs-i18n';
import type { I18nConfig } from '@modules/i18n/infrastructure/config/i18n.config';
import { ExactLanguageResolver } from '@modules/i18n/infrastructure/adapters/exact-language.resolver';
import { NestI18nTranslator } from '@modules/i18n/infrastructure/adapters/nest-i18n.translator';
import { ContentLanguageInterceptor } from '@modules/i18n/presentation/interceptors/content-language.interceptor';
import { TRANSLATOR } from '@modules/i18n/application/ports/tokens';
import {
  isSupportedLanguage,
  SUPPORTED_LANGUAGES,
} from '@modules/i18n/domain/constants/i18n.constants';

/**
 * Global — every module produces caller-facing messages, so the alternative
 * is importing this into all of them. Follows the message-queue precedent
 * for cross-cutting infrastructure (see research.md Decision 6).
 */
@Global()
@Module({
  imports: [
    NestI18nModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage:
          configService.get<I18nConfig>('i18n')!.defaultLanguage,
        loaderOptions: {
          path: join(__dirname, 'infrastructure/catalogs/'),
          watch: process.env.NODE_ENV !== 'production',
        },
        // Never let a missing key become a raw key or a thrown 500 (FR-018)
        // — NestI18nTranslator handles the miss itself.
        throwOnMissingKey: false,
      }),
      inject: [ConfigService],
      loader: I18nJsonLoader,
      resolvers: [ExactLanguageResolver],
    }),
  ],
  providers: [
    { provide: TRANSLATOR, useClass: NestI18nTranslator },
    { provide: APP_INTERCEPTOR, useClass: ContentLanguageInterceptor },
    // Needs TRANSLATOR (this module's token), so it registers here rather
    // than via `new ResponseInterceptor()` in main.ts — DI is the only way
    // it can receive the translator.
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    // Same reason: GlobalExceptionFilter now injects TRANSLATOR, so it must
    // come from DI rather than `new GlobalExceptionFilter()` in main.ts.
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
  exports: [TRANSLATOR],
})
export class I18nModule implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * FR-006b: a default language with no catalog must fail loudly at boot,
   * not silently at the first request that needs a fallback.
   */
  onModuleInit(): void {
    const defaultLanguage =
      this.configService.get<I18nConfig>('i18n')!.defaultLanguage;

    if (!isSupportedLanguage(defaultLanguage)) {
      throw new Error(
        `I18N_DEFAULT_LANGUAGE="${defaultLanguage}" is not a supported language (${SUPPORTED_LANGUAGES.join(', ')}).`,
      );
    }

    const loadedLanguages = this.i18n.getSupportedLanguages();
    if (!loadedLanguages.includes(defaultLanguage)) {
      throw new Error(
        `I18N_DEFAULT_LANGUAGE="${defaultLanguage}" has no catalog under src/modules/i18n/infrastructure/catalogs/. ` +
          `Found catalogs for: ${loadedLanguages.join(', ') || '(none)'}.`,
      );
    }
  }
}
