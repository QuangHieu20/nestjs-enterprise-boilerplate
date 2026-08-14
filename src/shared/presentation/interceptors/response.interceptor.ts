import {
  Inject,
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';
import { TRANSLATOR } from '@modules/i18n/application/ports/tokens';
import type { ITranslator } from '@modules/i18n/application/ports/translator.interface';
import type { SupportedLanguage } from '@modules/i18n/domain/constants/i18n.constants';

/**
 * A handler may return this shape to steer the envelope; anything else is
 * taken as `data` verbatim.
 */
interface HandlerEnvelope<T> {
  data?: T;
  message?: string;
  meta?: unknown;
}

type HandlerResult<T> = T | HandlerEnvelope<T>;

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  HandlerResult<T>,
  ApiResponse<T>
> {
  constructor(@Inject(TRANSLATOR) private readonly translator: ITranslator) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<HandlerResult<T>>,
  ): Observable<ApiResponse<T>> {
    const lang = (I18nContext.current()?.lang ?? 'en') as SupportedLanguage;

    return next.handle().pipe(
      map((payload) => {
        // The envelope keys are probed, not required — a plain entity simply
        // has none of them and falls through to `data`.
        const envelope = payload as HandlerEnvelope<T> | null | undefined;
        return {
          success: true,
          data: envelope?.data !== undefined ? envelope.data : (payload as T),
          // A handler-supplied `message` is a catalog key, same contract as
          // the fallback below — it must go through the translator too, or
          // the caller sees the raw key (e.g. logout's 'common.logout_successful').
          message: envelope?.message
            ? this.translator.translate(envelope.message, lang)
            : this.translator.translate('common.operation_successful', lang),
          meta: envelope?.meta || undefined,
        };
      }),
    );
  }
}
