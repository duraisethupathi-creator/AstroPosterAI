import type {TranslationKey} from '../../i18n';

export const ZODIACS = [
  {id: 'aries', symbol: '♈', translationKey: 'zodiac.aries'},
  {id: 'taurus', symbol: '♉', translationKey: 'zodiac.taurus'},
  {id: 'gemini', symbol: '♊', translationKey: 'zodiac.gemini'},
  {id: 'cancer', symbol: '♋', translationKey: 'zodiac.cancer'},
  {id: 'leo', symbol: '♌', translationKey: 'zodiac.leo'},
  {id: 'virgo', symbol: '♍', translationKey: 'zodiac.virgo'},
  {id: 'libra', symbol: '♎', translationKey: 'zodiac.libra'},
  {id: 'scorpio', symbol: '♏', translationKey: 'zodiac.scorpio'},
  {id: 'sagittarius', symbol: '♐', translationKey: 'zodiac.sagittarius'},
  {id: 'capricorn', symbol: '♑', translationKey: 'zodiac.capricorn'},
  {id: 'aquarius', symbol: '♒', translationKey: 'zodiac.aquarius'},
  {id: 'pisces', symbol: '♓', translationKey: 'zodiac.pisces'},
] as const satisfies readonly {id: string; symbol: string; translationKey: TranslationKey}[];

export type ZodiacId = typeof ZODIACS[number]['id'];
export function isZodiacId(value: unknown): value is ZodiacId {
  return ZODIACS.some(zodiac => zodiac.id === value);
}
