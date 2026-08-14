import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Request, Response } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { DomainException } from '@shared/domain/exceptions/domain.exception';
import { TRANSLATOR } from '@modules/i18n/application/ports/tokens';
import type { ITranslator } from '@modules/i18n/application/ports/translator.interface';
import type { SupportedLanguage } from '@modules/i18n/domain/constants/i18n.constants';

const INTERNAL_ERROR_KEY = 'common.internal_error';
const INTERNAL_ERROR_MESSAGE = 'Internal server error';

/** Widened to `number`: `status` is a plain number, not an HttpStatus member. */
const SERVER_ERROR_THRESHOLD: number = HttpStatus.INTERNAL_SERVER_ERROR;

@Injectable()
@Catch()
export class GlobalExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(@Inject(TRANSLATOR) private readonly translator: ITranslator) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const lang = (I18nContext.current()?.lang ?? 'en') as SupportedLanguage;

    const { status, rawMessage, isArray } = this.resolve(exception);
    const isServerError = status >= SERVER_ERROR_THRESHOLD;

    // `rawMessage` is a catalog key for use-case exceptions (Decision 8), or
    // prose for exceptions NestJS raises itself (router/framework errors) —
    // arrays are class-validator's per-field errors, not keys. Calling
    // `translate()` unconditionally on the non-array string case is safe: a
    // miss (prose matching no key) renders the generic message instead of
    // leaking raw framework text, which is exactly FR-018's contract. The
    // status code is never touched because of a missing key (FR-018a).
    const message = isServerError
      ? this.translator.translate(INTERNAL_ERROR_KEY, lang)
      : isArray
        ? rawMessage
        : this.translator.translate(rawMessage, lang);

    // Logged in its original (untranslated) form — FR-015 keeps
    // operator-facing logs in one fixed language regardless of caller lang.
    this.log(exception, request, status, rawMessage);

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private resolve(exception: unknown): {
    status: number;
    rawMessage: string;
    isArray: boolean;
  } {
    if (exception instanceof HttpException) {
      const { text, isArray } = this.extractMessage(
        exception.getResponse(),
        exception.message,
      );
      return { status: exception.getStatus(), rawMessage: text, isArray };
    }

    if (exception instanceof DomainException) {
      return {
        status: exception.status,
        rawMessage: exception.message,
        isArray: false,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      rawMessage:
        exception instanceof Error ? exception.message : INTERNAL_ERROR_MESSAGE,
      isArray: false,
    };
  }

  /**
   * HttpException payloads vary: a string, or an object whose `message` is a
   * string or a string[] (ValidationPipe emits the array form). The array
   * form is flagged so `catch` skips translation — those entries are not
   * catalog keys (validation localization is handled separately, see US3).
   */
  private extractMessage(
    payload: unknown,
    fallback: string,
  ): { text: string; isArray: boolean } {
    if (typeof payload === 'string') return { text: payload, isArray: false };

    if (typeof payload === 'object' && payload !== null) {
      const { message } = payload as { message?: unknown };
      if (Array.isArray(message)) {
        return {
          text: message.map((m) => String(m)).join('; '),
          isArray: true,
        };
      }
      if (typeof message === 'string') return { text: message, isArray: false };
    }

    return { text: fallback, isArray: false };
  }

  private log(
    exception: unknown,
    request: Request,
    status: number,
    message: string,
  ): void {
    const context = `${request.method} ${request.url} ${status} - ${message}`;

    if (status >= SERVER_ERROR_THRESHOLD) {
      const stack =
        exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(context, stack);
    } else {
      this.logger.warn(context);
    }
  }
}
