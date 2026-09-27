import type {LanguageCode, TranslationKey} from '../../i18n';
import type {BrandSnapshot} from '../../types/brandProfile';
import type {AstrologyCategoryId} from './categories';
import type {ZodiacId} from './zodiac';

export type {AstrologyCategoryId, ZodiacId};
export type FieldValue = string | number | boolean;
export type FieldId = 'date' | 'week' | 'month' | 'year' | 'zodiac' | 'extraInstruction' |
  'nakshatra' | 'transitDate' | 'planet' | 'focus' | 'name' | 'birthDate' | 'messageStyle' |
  'festival' | 'service' | 'offer' | 'cta' | 'title' | 'contentBrief' | 'includeBrand';
export type FormValues = Partial<Record<FieldId, FieldValue>>;
export type Period = {date?: string; week?: string; month?: number; year?: number};
export type SelectOption = {value: string | number; translationKey: TranslationKey};

type FieldBase = {
  id: FieldId;
  labelKey: TranslationKey;
  placeholderKey?: TranslationKey;
  required?: boolean;
  defaultValue?: FieldValue;
};
export type CategoryField = FieldBase & (
  | {type: 'text' | 'multiline'; maxLength: number}
  | {type: 'date'; periodKey?: 'date' | 'week'; pastOnly?: boolean}
  | {type: 'year'; periodKey: 'year'}
  | {type: 'select'; options: readonly SelectOption[]; periodKey?: 'month'}
  | {type: 'zodiac'}
  | {type: 'toggle'}
);

export type OutputSectionId = 'general' | 'career' | 'finance' | 'love' | 'health' |
  'luckyNumber' | 'luckyColour' | 'positiveMessage' | 'title' | 'greeting' | 'message' |
  'cta' | 'headline' | 'description' | 'overview' | 'impact' | 'guidance' | 'remedy' | 'blessing' | 'tips';
export type PromptType = 'horoscope' | 'nakshatra' | 'transit' | 'topic' | 'remedy' |
  'tips' | 'blessing' | 'birthday' | 'greeting' | 'advertisement' | 'custom';

export type AstrologyCategoryDefinition = {
  id: string;
  translationKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: string;
  requiresZodiac: boolean;
  supportsAllZodiacs: boolean;
  dateMode: 'none' | 'date' | 'week' | 'month' | 'year';
  fields: readonly CategoryField[];
  outputSections: readonly OutputSectionId[];
  promptType: PromptType;
};

export type ValidationErrors = Partial<Record<FieldId | 'category' | 'language' | 'generateAllZodiacs', TranslationKey>>;

export type AstrologyGenerationRequest = {
  categoryId: AstrologyCategoryId;
  language: LanguageCode;
  zodiacId?: ZodiacId;
  generateAllZodiacs: boolean;
  period?: Period;
  inputs: Record<string, FieldValue>;
  extraInstruction?: string;
  brand?: BrandSnapshot;
  promptType: PromptType;
  outputSections: readonly OutputSectionId[];
};

export type RequestResult = {ok: true; request: AstrologyGenerationRequest} | {ok: false; errors: ValidationErrors};
