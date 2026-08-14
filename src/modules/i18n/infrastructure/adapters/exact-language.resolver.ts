import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { I18nResolver } from 'nestjs-i18n';
import type { Request } from 'express';
import {
  isSupportedLanguage,
  type SupportedLanguage,
} from '@modules/i18n/domain/constants/i18n.constants';
import type { I18nConfig } from '@modules/i18n/infrastructure/config/i18n.config';

/**
 * Exact-match only (FR-003a). nestjs-i18n's own fallback strips regional
 * qualifiers (`vi-VN` -> `vi`), which contradicts the spec. Returning
 * `undefined` for anything that isn't exactly `en`/`vi` lets `fallbackLanguage`
 * take over without ever reaching that stripping logic.
 */
@Injectable()
export class ExactLanguageResolver implements I18nResolver {
  constructor(private readonly configService: ConfigService) {}

  resolve(context: ExecutionContext): SupportedLanguage | undefined {
    const request = context.switchToHttp().getRequest<Request>();
    const headerName =
      this.configService.get<I18nConfig>('i18n')?.headerName ??
      'x-language-custom';

    const raw = request.headers[headerName.toLowerCase()];
    const value = this.firstValue(raw);

    return isSupportedLanguage(value) ? value : undefined;
  }

  /**
   * A header sent twice never arrives as a JS array in real Express/Node —
   * only `set-cookie` gets that treatment. Every other repeated header is
   * coalesced per RFC 7230 into a single comma-joined string (`"vi, en"`).
   * A mocked ExecutionContext can hide this: the array branch here is kept
   * only for resolvers/adapters that hand us a true array directly.
   */
  private firstValue(raw: string | string[] | undefined): string | undefined {
    if (Array.isArray(raw)) return raw[0]?.trim();
    return raw?.split(',')[0]?.trim();
  }
}
