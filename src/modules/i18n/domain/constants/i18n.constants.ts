export type SupportedLanguage = 'en' | 'vi';

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = ['en', 'vi'];

export function isSupportedLanguage(
  value: unknown,
): value is SupportedLanguage {
  return value === 'en' || value === 'vi';
}
