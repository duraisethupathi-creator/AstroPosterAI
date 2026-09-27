import type {TranslationKey} from '../i18n';

export type PosterCategory = {
  id: string;
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  icon: string;
};

export const POSTER_CATEGORIES = [
  {
    "id": "daily",
    "titleKey": "category.daily",
    "subtitleKey": "category.daily.subtitle",
    "icon": "☀️"
  },
  {
    "id": "weekly",
    "titleKey": "category.weekly",
    "subtitleKey": "category.weekly.subtitle",
    "icon": "🗓️"
  },
  {
    "id": "monthly",
    "titleKey": "category.monthly",
    "subtitleKey": "category.monthly.subtitle",
    "icon": "🌙"
  },
  {
    "id": "yearly",
    "titleKey": "category.yearly",
    "subtitleKey": "category.yearly.subtitle",
    "icon": "✨"
  },
  {
    "id": "sani-peyarchi",
    "titleKey": "category.sani-peyarchi",
    "subtitleKey": "category.sani-peyarchi.subtitle",
    "icon": "🪐"
  },
  {
    "id": "guru-peyarchi",
    "titleKey": "category.guru-peyarchi",
    "subtitleKey": "category.guru-peyarchi.subtitle",
    "icon": "🌟"
  },
  {
    "id": "rahu-ketu",
    "titleKey": "category.rahu-ketu",
    "subtitleKey": "category.rahu-ketu.subtitle",
    "icon": "☯️"
  },
  {
    "id": "marriage",
    "titleKey": "category.marriage",
    "subtitleKey": "category.marriage.subtitle",
    "icon": "💍"
  },
  {
    "id": "career",
    "titleKey": "category.career",
    "subtitleKey": "category.career.subtitle",
    "icon": "💼"
  },
  {
    "id": "finance",
    "titleKey": "category.finance",
    "subtitleKey": "category.finance.subtitle",
    "icon": "🪙"
  },
  {
    "id": "pariharam",
    "titleKey": "category.pariharam",
    "subtitleKey": "category.pariharam.subtitle",
    "icon": "🪔"
  },
  {
    "id": "festival",
    "titleKey": "category.festival",
    "subtitleKey": "category.festival.subtitle",
    "icon": "🙏"
  }
] as const satisfies readonly PosterCategory[];

export const ZODIACS = [
  {
    "id": "aries",
    "nameKey": "zodiac.aries",
    "icon": "♈"
  },
  {
    "id": "taurus",
    "nameKey": "zodiac.taurus",
    "icon": "♉"
  },
  {
    "id": "gemini",
    "nameKey": "zodiac.gemini",
    "icon": "♊"
  },
  {
    "id": "cancer",
    "nameKey": "zodiac.cancer",
    "icon": "♋"
  },
  {
    "id": "leo",
    "nameKey": "zodiac.leo",
    "icon": "♌"
  },
  {
    "id": "virgo",
    "nameKey": "zodiac.virgo",
    "icon": "♍"
  },
  {
    "id": "libra",
    "nameKey": "zodiac.libra",
    "icon": "♎"
  },
  {
    "id": "scorpio",
    "nameKey": "zodiac.scorpio",
    "icon": "♏"
  },
  {
    "id": "sagittarius",
    "nameKey": "zodiac.sagittarius",
    "icon": "♐"
  },
  {
    "id": "capricorn",
    "nameKey": "zodiac.capricorn",
    "icon": "♑"
  },
  {
    "id": "aquarius",
    "nameKey": "zodiac.aquarius",
    "icon": "♒"
  },
  {
    "id": "pisces",
    "nameKey": "zodiac.pisces",
    "icon": "♓"
  }
] as const satisfies readonly {id: string; nameKey: TranslationKey; icon: string}[];

export type PosterCategoryId = typeof POSTER_CATEGORIES[number]['id'];
export type ZodiacId = typeof ZODIACS[number]['id'];
