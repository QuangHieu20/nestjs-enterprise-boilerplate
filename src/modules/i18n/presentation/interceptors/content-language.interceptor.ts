import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import type { Response } from 'express';
import { Observable } from 'rxjs';

/**
 * The only signal a caller has that a declared language was rejected
 * (FR-003a rejects silently, not with an error) — see FR-003b.
 */
@Injectable()
export class ContentLanguageInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse<Response>();
    const lang = I18nContext.current()?.lang ?? 'en';
    response.setHeader('Content-Language', lang);
    return next.handle();
  }
}
