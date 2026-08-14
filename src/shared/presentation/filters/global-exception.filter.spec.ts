import { ArgumentsHost, ConflictException, HttpStatus } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import type { Request, Response } from 'express';
import { GlobalExceptionFilter } from './global-exception.filter';
import type { ITranslator } from '@modules/i18n/application/ports/translator.interface';

/**
 * `.json()` is the only thing under test, but the filter is a real
 * `BaseExceptionFilter` subclass — building a full Nest ArgumentsHost/Response
 * would drag the whole HTTP adapter in. This is the same "just enough surface"
 * mocking style as `google-auth.guard.spec.ts` and `exact-language.resolver.spec.ts`.
 */
function buildHost(request: Partial<Request> = {}): {
  host: ArgumentsHost;
  status: jest.Mock;
  json: jest.Mock;
} {
  const json = jest.fn();
  // Kept as plain jest.Mock locals (not read back off `response.status`) so
  // assertions don't trip `@typescript-eslint/unbound-method` — `response`
  // is typed as express's `Response`, which isn't known to be a mock.
  const status = jest.fn().mockReturnValue({ json });
  const response = { status } as unknown as Response;
  const fullRequest = {
    method: 'GET',
    url: '/api/v1/whatever',
    ...request,
  } as Request;

  const host = {
    switchToHttp: () => ({
      getRequest: () => fullRequest,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

function buildTranslator(translateImpl?: jest.Mock): ITranslator {
  return {
    translate: (translateImpl ??
      jest.fn((key: string) => key)) as ITranslator['translate'],
  };
}

describe('GlobalExceptionFilter (US2, FR-018, FR-018a, FR-015)', () => {
  beforeEach(() => {
    jest.spyOn(I18nContext, 'current').mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('translates a known key and keeps the original status code (409 stays 409)', () => {
    const translate = jest.fn((key: string) =>
      key === 'auth.register.email_taken'
        ? 'This email is already in use'
        : key,
    );
    const translator = buildTranslator(translate);
    const filter = new GlobalExceptionFilter(translator);
    const { host, status, json } = buildHost();

    filter.catch(new ConflictException('auth.register.email_taken'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: 'This email is already in use',
      }),
    );
    expect(translate).toHaveBeenCalledWith('auth.register.email_taken', 'en');
  });

  it('a missing key at 409 stays 409 with generic text — a bug in our catalog must not cost the caller their status code', () => {
    // NestI18nTranslator's real miss behaviour: unknown key renders the
    // generic message rather than the raw key.
    const translate = jest.fn(() => 'Internal server error');
    const translator = buildTranslator(translate);
    const filter = new GlobalExceptionFilter(translator);
    const { host, status, json } = buildHost();

    filter.catch(new ConflictException('auth.register.some_missing_key'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        message: 'Internal server error',
      }),
    );
  });

  it('a 5xx (non-HttpException) renders the translated generic message and leaks nothing internal', () => {
    const translate = jest.fn((key: string) =>
      key === 'common.internal_error' ? 'Đã xảy ra lỗi hệ thống' : key,
    );
    const translator = buildTranslator(translate);
    const filter = new GlobalExceptionFilter(translator);
    const { host, status, json } = buildHost();

    filter.catch(new Error('secret db connection string leaked here'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Đã xảy ra lỗi hệ thống',
      }),
    );
    expect(translate).toHaveBeenCalledWith('common.internal_error', 'en');
    const body = (json.mock.calls[0] as [Record<string, unknown>])[0];
    expect(JSON.stringify(body)).not.toContain('secret db connection string');
  });

  it('resolves the language from I18nContext.current() when set', () => {
    jest
      .spyOn(I18nContext, 'current')
      .mockReturnValue({ lang: 'vi' } as unknown as I18nContext);
    const translate = jest.fn((key: string) =>
      key === 'auth.login.invalid_credentials'
        ? 'Email hoặc mật khẩu không chính xác'
        : key,
    );
    const translator = buildTranslator(translate);
    const filter = new GlobalExceptionFilter(translator);
    const { host, json } = buildHost();

    filter.catch(new ConflictException('auth.login.invalid_credentials'), host);

    expect(translate).toHaveBeenCalledWith(
      'auth.login.invalid_credentials',
      'vi',
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Email hoặc mật khẩu không chính xác',
      }),
    );
  });

  it('validation-style array messages pass through untranslated and unbroken', () => {
    const translate = jest.fn((key: string) => key);
    const translator = buildTranslator(translate);
    const filter = new GlobalExceptionFilter(translator);
    const { host, status, json } = buildHost();

    const exception = new ConflictException({
      message: [
        'Email không được để trống',
        'Mật khẩu phải từ 6 ký tự trở lên',
      ],
    });

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Email không được để trống; Mật khẩu phải từ 6 ký tự trở lên',
      }),
    );
    // The array branch never calls the translator — those aren't catalog keys yet.
    expect(translate).not.toHaveBeenCalled();
  });
});
