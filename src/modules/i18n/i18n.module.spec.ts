import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { I18nModule } from './i18n.module';

describe('I18nModule boot guard (FR-006b, SC-004a)', () => {
  function build(defaultLanguage: string, loadedLanguages: string[]) {
    const configService = {
      get: jest.fn().mockReturnValue({ defaultLanguage, headerName: 'x' }),
    } as unknown as ConfigService;
    const i18nService = {
      getSupportedLanguages: jest.fn().mockReturnValue(loadedLanguages),
    } as unknown as I18nService;
    return new I18nModule(configService, i18nService);
  }

  it('refuses to start when the default language is not en/vi', () => {
    const module = build('fr', ['en', 'vi']);
    expect(() => module.onModuleInit()).toThrow(/not a supported language/);
  });

  it('refuses to start when the default language has no loaded catalog', () => {
    const module = build('vi', ['en']);
    expect(() => module.onModuleInit()).toThrow(/has no catalog/);
  });

  it('boots when the default language is supported and has a catalog', () => {
    const module = build('en', ['en', 'vi']);
    expect(() => module.onModuleInit()).not.toThrow();
  });
});
