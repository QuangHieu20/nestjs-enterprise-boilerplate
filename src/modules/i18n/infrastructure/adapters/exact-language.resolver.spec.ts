import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExactLanguageResolver } from './exact-language.resolver';

function buildContext(
  headers: Record<string, string | string[]>,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

describe('ExactLanguageResolver (FR-003a, FR-004)', () => {
  const HEADER = 'x-language-custom';

  function buildResolver(): ExactLanguageResolver {
    const configService = {
      get: jest.fn().mockReturnValue({ headerName: HEADER }),
    } as unknown as ConfigService;
    return new ExactLanguageResolver(configService);
  }

  it.each([
    ['vi', 'vi'],
    ['en', 'en'],
    [undefined, undefined],
    ['', undefined],
    ['fr', undefined],
    // The sharp edge of exact matching (FR-003a): region-qualified and
    // differently-cased forms are unsupported, not normalized.
    ['vi-VN', undefined],
    ['VI', undefined],
    ['en-US', undefined],
  ])('header value %p resolves to %p', (headerValue, expected) => {
    const resolver = buildResolver();
    const headers: Record<string, string | string[]> = {};
    if (headerValue !== undefined) headers[HEADER] = headerValue;

    expect(resolver.resolve(buildContext(headers))).toBe(expected);
  });

  // Real Express/Node never delivers a repeated custom header as a JS array
  // (only `set-cookie` gets that treatment) — it coalesces to a single
  // comma-joined string per RFC 7230. An end-to-end supertest run caught this:
  // the array-shaped test below alone would have hidden the bug entirely.
  it('a repeated header, coalesced to a comma-joined string as Express really does it, resolves from the first entry (FR-004)', () => {
    const resolver = buildResolver();
    const context = buildContext({ [HEADER]: 'vi, en' });

    expect(resolver.resolve(context)).toBe('vi');
  });

  it('a comma-joined header with an unsupported first entry falls through to undefined', () => {
    const resolver = buildResolver();
    const context = buildContext({ [HEADER]: 'fr, vi' });

    expect(resolver.resolve(context)).toBeUndefined();
  });

  it('a true JS array (defensive — some adapters/mocks may still hand us one) also resolves from the first entry', () => {
    const resolver = buildResolver();
    const context = buildContext({ [HEADER]: ['vi', 'en'] });

    expect(resolver.resolve(context)).toBe('vi');
  });
});
