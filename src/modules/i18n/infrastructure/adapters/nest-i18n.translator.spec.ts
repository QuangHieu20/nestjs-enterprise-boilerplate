import { I18nService } from 'nestjs-i18n';
import { NestI18nTranslator } from './nest-i18n.translator';

describe('NestI18nTranslator missing-key handling (FR-018, SC-008)', () => {
  function buildTranslator(translateImpl: (key: string) => string) {
    const i18n = {
      translate: jest.fn((key: string) => translateImpl(key)),
    } as unknown as I18nService;
    return { translator: new NestI18nTranslator(i18n), i18n };
  }

  it('a known key returns its translated text untouched', () => {
    const { translator } = buildTranslator((key) =>
      key === 'auth.login.invalid_credentials'
        ? 'Wrong email or password'
        : key,
    );

    expect(translator.translate('auth.login.invalid_credentials', 'en')).toBe(
      'Wrong email or password',
    );
  });

  it('a key missing from every catalog renders the generic message, not the raw key', () => {
    const { translator } = buildTranslator((key) =>
      key === 'common.internal_error' ? 'Internal server error' : key,
    );

    const result = translator.translate('auth.nonexistent.key', 'en');

    expect(result).toBe('Internal server error');
    expect(result).not.toBe('auth.nonexistent.key');
    expect(result).not.toBe('');
  });

  it('logs the missing key at error level exactly once (SC-008)', () => {
    const { translator } = buildTranslator((key) =>
      key === 'common.internal_error' ? 'Internal server error' : key,
    );
    const errorSpy = jest
      .spyOn(translator['logger'], 'error')
      .mockImplementation(() => undefined);

    translator.translate('auth.nonexistent.key', 'en');

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toContain('auth.nonexistent.key');
  });

  it('never throws, even when the generic message itself is missing', () => {
    const { translator } = buildTranslator((key) => key);

    expect(() => translator.translate('anything.missing', 'en')).not.toThrow();
  });
});
