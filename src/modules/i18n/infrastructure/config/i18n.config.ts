import { registerAs } from '@nestjs/config';

export interface I18nConfig {
  headerName: string;
  defaultLanguage: string;
}

export default registerAs('i18n', (): I18nConfig => ({
  headerName: process.env.I18N_HEADER_NAME || 'x-language-custom',
  defaultLanguage: process.env.I18N_DEFAULT_LANGUAGE || 'en',
}));
