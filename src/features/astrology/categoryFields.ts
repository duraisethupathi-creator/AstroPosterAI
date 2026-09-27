import type {CategoryField, SelectOption} from './types';

export const MONTH_OPTIONS = [
  {value: 1, translationKey: 'month.january'}, {value: 2, translationKey: 'month.february'},
  {value: 3, translationKey: 'month.march'}, {value: 4, translationKey: 'month.april'},
  {value: 5, translationKey: 'month.may'}, {value: 6, translationKey: 'month.june'},
  {value: 7, translationKey: 'month.july'}, {value: 8, translationKey: 'month.august'},
  {value: 9, translationKey: 'month.september'}, {value: 10, translationKey: 'month.october'},
  {value: 11, translationKey: 'month.november'}, {value: 12, translationKey: 'month.december'},
] as const satisfies readonly SelectOption[];

export const FIELDS = {
  date: {id: 'date', type: 'date', labelKey: 'astro.date', placeholderKey: 'astro.dateHint', required: true, periodKey: 'date'},
  week: {id: 'week', type: 'date', labelKey: 'astro.week', placeholderKey: 'astro.dateHint', required: true, periodKey: 'week'},
  month: {id: 'month', type: 'select', labelKey: 'astro.month', required: true, options: MONTH_OPTIONS, periodKey: 'month'},
  year: {id: 'year', type: 'year', labelKey: 'astro.year', placeholderKey: 'astro.yearHint', required: true, periodKey: 'year'},
  zodiac: {id: 'zodiac', type: 'zodiac', labelKey: 'zodiac', required: true},
  optionalZodiac: {id: 'zodiac', type: 'zodiac', labelKey: 'astro.optionalZodiac'},
  extraInstruction: {id: 'extraInstruction', type: 'multiline', labelKey: 'extraInstruction', placeholderKey: 'instructionPlaceholder', maxLength: 2000},
  nakshatra: {id: 'nakshatra', type: 'text', labelKey: 'astro.nakshatra', placeholderKey: 'astro.nakshatraHint', required: true, maxLength: 100},
  transitDate: {id: 'transitDate', type: 'date', labelKey: 'astro.transitDate', placeholderKey: 'astro.dateHint', required: true, periodKey: 'date'},
  planet: {id: 'planet', type: 'select', labelKey: 'astro.planet', required: true, options: [
    {value: 'sun', translationKey: 'planet.sun'}, {value: 'moon', translationKey: 'planet.moon'},
    {value: 'mars', translationKey: 'planet.mars'}, {value: 'mercury', translationKey: 'planet.mercury'},
    {value: 'venus', translationKey: 'planet.venus'},
  ]},
  focus: {id: 'focus', type: 'text', labelKey: 'astro.focus', placeholderKey: 'astro.focusHint', required: true, maxLength: 300},
  name: {id: 'name', type: 'text', labelKey: 'astro.name', placeholderKey: 'astro.nameHint', required: true, maxLength: 100},
  birthDate: {id: 'birthDate', type: 'date', labelKey: 'astro.birthDate', placeholderKey: 'astro.dateHint', pastOnly: true},
  messageStyle: {id: 'messageStyle', type: 'select', labelKey: 'astro.messageStyle', required: true, defaultValue: 'traditional', options: [
    {value: 'traditional', translationKey: 'design.traditional'},
    {value: 'positive', translationKey: 'astro.stylePositive'},
    {value: 'premium', translationKey: 'astro.stylePremium'},
    {value: 'simple', translationKey: 'astro.styleSimple'},
  ]},
  festival: {id: 'festival', type: 'text', labelKey: 'astro.festival', placeholderKey: 'astro.festivalHint', required: true, maxLength: 150},
  service: {id: 'service', type: 'text', labelKey: 'astro.service', placeholderKey: 'astro.serviceHint', required: true, maxLength: 200},
  offer: {id: 'offer', type: 'multiline', labelKey: 'astro.offer', placeholderKey: 'astro.offerHint', maxLength: 1000},
  cta: {id: 'cta', type: 'text', labelKey: 'astro.cta', placeholderKey: 'astro.ctaHint', required: true, maxLength: 200},
  title: {id: 'title', type: 'text', labelKey: 'astro.title', placeholderKey: 'astro.titleHint', required: true, maxLength: 200},
  contentBrief: {id: 'contentBrief', type: 'multiline', labelKey: 'astro.contentBrief', placeholderKey: 'astro.briefHint', required: true, maxLength: 2000},
  includeBrand: {id: 'includeBrand', type: 'toggle', labelKey: 'astro.includeBrand', defaultValue: true},
} as const satisfies Record<string, CategoryField>;
