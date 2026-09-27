import type {AstrologyCategoryDefinition} from './types';
import {FIELDS} from './categoryFields';

// Sole category registry. Adding a category here drives Home, Create,
// validation, bulk eligibility and the expected output contract.
export const ASTROLOGY_CATEGORIES = [
  {
    id: 'daily', translationKey: 'category.daily', descriptionKey: 'category.daily.subtitle', icon: '☀️',
    requiresZodiac: true, supportsAllZodiacs: true, dateMode: 'date',
    fields: [FIELDS.date, FIELDS.zodiac, FIELDS.extraInstruction],
    outputSections: ["general","career","finance","love","health","luckyNumber","luckyColour","positiveMessage"], promptType: 'horoscope',
  },
  {
    id: 'weekly', translationKey: 'category.weekly', descriptionKey: 'category.weekly.subtitle', icon: '🗓️',
    requiresZodiac: true, supportsAllZodiacs: true, dateMode: 'week',
    fields: [FIELDS.week, FIELDS.zodiac, FIELDS.extraInstruction],
    outputSections: ["general","career","finance","love","health","positiveMessage"], promptType: 'horoscope',
  },
  {
    id: 'monthly', translationKey: 'category.monthly', descriptionKey: 'category.monthly.subtitle', icon: '🌙',
    requiresZodiac: true, supportsAllZodiacs: true, dateMode: 'month',
    fields: [FIELDS.month, FIELDS.year, FIELDS.zodiac, FIELDS.extraInstruction],
    outputSections: ["general","career","finance","love","health","positiveMessage"], promptType: 'horoscope',
  },
  {
    id: 'yearly', translationKey: 'category.yearly', descriptionKey: 'category.yearly.subtitle', icon: '✨',
    requiresZodiac: true, supportsAllZodiacs: true, dateMode: 'year',
    fields: [FIELDS.year, FIELDS.zodiac, FIELDS.extraInstruction],
    outputSections: ["overview","career","finance","love","health","guidance"], promptType: 'horoscope',
  },
  {
    id: 'nakshatra', translationKey: 'category.nakshatra', descriptionKey: 'category.nakshatra.subtitle', icon: '⭐',
    requiresZodiac: false, supportsAllZodiacs: false, dateMode: 'date',
    fields: [FIELDS.nakshatra, FIELDS.date, FIELDS.extraInstruction],
    outputSections: ["overview","guidance","positiveMessage"], promptType: 'nakshatra',
  },
  {
    id: 'sani-peyarchi', translationKey: 'category.sani-peyarchi', descriptionKey: 'category.sani-peyarchi.subtitle', icon: '🪐',
    requiresZodiac: true, supportsAllZodiacs: true, dateMode: 'date',
    fields: [FIELDS.transitDate, FIELDS.zodiac, FIELDS.extraInstruction],
    outputSections: ["overview","impact","guidance","remedy"], promptType: 'transit',
  },
  {
    id: 'guru-peyarchi', translationKey: 'category.guru-peyarchi', descriptionKey: 'category.guru-peyarchi.subtitle', icon: '🌟',
    requiresZodiac: true, supportsAllZodiacs: true, dateMode: 'date',
    fields: [FIELDS.transitDate, FIELDS.zodiac, FIELDS.extraInstruction],
    outputSections: ["overview","impact","guidance","remedy"], promptType: 'transit',
  },
  {
    id: 'rahu-ketu', translationKey: 'category.rahu-ketu', descriptionKey: 'category.rahu-ketu.subtitle', icon: '☯️',
    requiresZodiac: true, supportsAllZodiacs: true, dateMode: 'date',
    fields: [FIELDS.transitDate, FIELDS.zodiac, FIELDS.extraInstruction],
    outputSections: ["overview","impact","guidance","remedy"], promptType: 'transit',
  },
  {
    id: 'graha-peyarchi', translationKey: 'category.graha-peyarchi', descriptionKey: 'category.graha-peyarchi.subtitle', icon: '🌌',
    requiresZodiac: true, supportsAllZodiacs: false, dateMode: 'date',
    fields: [FIELDS.planet, FIELDS.transitDate, FIELDS.zodiac, FIELDS.extraInstruction],
    outputSections: ["overview","impact","guidance"], promptType: 'transit',
  },
  {
    id: 'marriage', translationKey: 'category.marriage', descriptionKey: 'category.marriage.subtitle', icon: '💍',
    requiresZodiac: false, supportsAllZodiacs: false, dateMode: 'none',
    fields: [{...FIELDS.focus, labelKey: 'astro.marriageFocus'}, FIELDS.optionalZodiac, FIELDS.extraInstruction],
    outputSections: ["title","love","guidance","positiveMessage"], promptType: 'topic',
  },
  {
    id: 'career', translationKey: 'category.career', descriptionKey: 'category.career.subtitle', icon: '💼',
    requiresZodiac: true, supportsAllZodiacs: false, dateMode: 'none',
    fields: [{...FIELDS.focus, labelKey: 'astro.careerFocus'}, FIELDS.zodiac, FIELDS.extraInstruction],
    outputSections: ["title","career","guidance","positiveMessage"], promptType: 'topic',
  },
  {
    id: 'business', translationKey: 'category.business', descriptionKey: 'category.business.subtitle', icon: '🏢',
    requiresZodiac: true, supportsAllZodiacs: false, dateMode: 'none',
    fields: [{...FIELDS.focus, labelKey: 'astro.businessFocus'}, FIELDS.zodiac, FIELDS.extraInstruction],
    outputSections: ["title","overview","guidance","positiveMessage"], promptType: 'topic',
  },
  {
    id: 'finance', translationKey: 'category.finance', descriptionKey: 'category.finance.subtitle', icon: '🪙',
    requiresZodiac: true, supportsAllZodiacs: false, dateMode: 'none',
    fields: [{...FIELDS.focus, labelKey: 'astro.financeFocus'}, FIELDS.zodiac, FIELDS.extraInstruction],
    outputSections: ["title","finance","guidance","positiveMessage"], promptType: 'topic',
  },
  {
    id: 'love', translationKey: 'category.love', descriptionKey: 'category.love.subtitle', icon: '💞',
    requiresZodiac: false, supportsAllZodiacs: false, dateMode: 'none',
    fields: [{...FIELDS.focus, labelKey: 'astro.loveFocus'}, FIELDS.optionalZodiac, FIELDS.extraInstruction],
    outputSections: ["title","love","guidance","positiveMessage"], promptType: 'topic',
  },
  {
    id: 'health', translationKey: 'category.health', descriptionKey: 'category.health.subtitle', icon: '🌿',
    requiresZodiac: false, supportsAllZodiacs: false, dateMode: 'none',
    fields: [{...FIELDS.focus, labelKey: 'astro.healthFocus'}, FIELDS.optionalZodiac, FIELDS.extraInstruction],
    outputSections: ["title","health","guidance","positiveMessage"], promptType: 'topic',
  },
  {
    id: 'pariharam', translationKey: 'category.pariharam', descriptionKey: 'category.pariharam.subtitle', icon: '🪔',
    requiresZodiac: false, supportsAllZodiacs: false, dateMode: 'none',
    fields: [FIELDS.focus, FIELDS.optionalZodiac, FIELDS.extraInstruction],
    outputSections: ["title","remedy","guidance"], promptType: 'remedy',
  },
  {
    id: 'tips', translationKey: 'category.tips', descriptionKey: 'category.tips.subtitle', icon: '💡',
    requiresZodiac: false, supportsAllZodiacs: false, dateMode: 'none',
    fields: [FIELDS.focus, FIELDS.extraInstruction],
    outputSections: ["title","tips","positiveMessage"], promptType: 'tips',
  },
  {
    id: 'murugan', translationKey: 'category.murugan', descriptionKey: 'category.murugan.subtitle', icon: '🙏',
    requiresZodiac: false, supportsAllZodiacs: false, dateMode: 'none',
    fields: [FIELDS.messageStyle, FIELDS.extraInstruction],
    outputSections: ["title","blessing","message"], promptType: 'blessing',
  },
  {
    id: 'birthday', translationKey: 'category.birthday', descriptionKey: 'category.birthday.subtitle', icon: '🎂',
    requiresZodiac: false, supportsAllZodiacs: false, dateMode: 'none',
    fields: [FIELDS.name, FIELDS.birthDate, FIELDS.messageStyle, FIELDS.optionalZodiac, FIELDS.extraInstruction],
    outputSections: ["title","greeting","message"], promptType: 'birthday',
  },
  {
    id: 'festival', translationKey: 'category.festival', descriptionKey: 'category.festival.subtitle', icon: '🎉',
    requiresZodiac: false, supportsAllZodiacs: false, dateMode: 'date',
    fields: [FIELDS.festival, FIELDS.date, FIELDS.messageStyle, FIELDS.extraInstruction],
    outputSections: ["title","greeting","message","cta"], promptType: 'greeting',
  },
  {
    id: 'service-advertisement', translationKey: 'category.service-advertisement', descriptionKey: 'category.service-advertisement.subtitle', icon: '📣',
    requiresZodiac: false, supportsAllZodiacs: false, dateMode: 'none',
    fields: [FIELDS.service, FIELDS.offer, FIELDS.cta, FIELDS.extraInstruction],
    outputSections: ["headline","description","cta"], promptType: 'advertisement',
  },
  {
    id: 'custom', translationKey: 'category.custom', descriptionKey: 'category.custom.subtitle', icon: '🎨',
    requiresZodiac: false, supportsAllZodiacs: false, dateMode: 'none',
    fields: [FIELDS.title, FIELDS.contentBrief, FIELDS.optionalZodiac, FIELDS.extraInstruction],
    outputSections: ["title","message"], promptType: 'custom',
  },
] as const satisfies readonly AstrologyCategoryDefinition[];

export type AstrologyCategoryId = typeof ASTROLOGY_CATEGORIES[number]['id'];
export type CategoryOutput<Id extends AstrologyCategoryId> = Record<
  Extract<typeof ASTROLOGY_CATEGORIES[number], {id: Id}>['outputSections'][number], string
>;

export function isAstrologyCategoryId(value: unknown): value is AstrologyCategoryId {
  return ASTROLOGY_CATEGORIES.some(category => category.id === value);
}

export function getCategory(id: AstrologyCategoryId): AstrologyCategoryDefinition & {id: AstrologyCategoryId} {
  const category = ASTROLOGY_CATEGORIES.find(item => item.id === id);
  if (!category) throw new Error('Unknown astrology category');
  return category;
}
