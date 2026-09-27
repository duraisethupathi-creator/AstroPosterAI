import {messages, type TranslationDictionary, type TranslationKey} from './strings';

export const SUPPORTED_LANGUAGES = [
  {code: 'ta', nativeName: 'தமிழ்'},
  {code: 'en', nativeName: 'English'},
  {code: 'hi', nativeName: 'हिन्दी'},
  {code: 'te', nativeName: 'తెలుగు'},
  {code: 'kn', nativeName: 'ಕನ್ನಡ'},
  {code: 'ml', nativeName: 'മലയാളം'},
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];
export type {TranslationKey, TranslationDictionary};

export function isLanguageCode(value: unknown): value is LanguageCode {
  return SUPPORTED_LANGUAGES.some(({code}) => code === value);
}

function dictionary(column: number): TranslationDictionary {
  return Object.fromEntries(
    Object.entries(messages).map(([key, values]) => [key, values[column]]),
  ) as TranslationDictionary;
}

export const translations: Record<LanguageCode, TranslationDictionary> = {
  en: dictionary(0), ta: dictionary(1), hi: dictionary(2),
  te: dictionary(3), kn: dictionary(4), ml: dictionary(5),
};

export function translate(language: LanguageCode, key: TranslationKey): string {
  return translations[language][key] || translations.en[key];
}
