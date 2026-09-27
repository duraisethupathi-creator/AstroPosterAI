import {isLanguageCode, type LanguageCode} from '../../i18n';
import {emptyBrandProfile, toBrandSnapshot, type BrandSnapshot} from '../../types/brandProfile';
import {getCategory, isAstrologyCategoryId, type AstrologyCategoryId} from './categories';
import {isZodiacId} from './zodiac';
import {validateCategory} from './validation';
import type {AstrologyGenerationRequest, FormValues, Period, RequestResult} from './types';

export function buildAstrologyRequest({categoryId, language, values, generateAllZodiacs = false, brand}: {
  categoryId: AstrologyCategoryId; language: LanguageCode; values: FormValues;
  generateAllZodiacs?: boolean; brand?: BrandSnapshot;
}): RequestResult {
  if (!isAstrologyCategoryId(categoryId)) return {ok: false, errors: {category: 'astro.invalidSelection'}};
  if (!isLanguageCode(language)) return {ok: false, errors: {language: 'astro.invalidSelection'}};
  const category = getCategory(categoryId);
  const errors = validateCategory(category, values, generateAllZodiacs);
  if (Object.keys(errors).length) return {ok: false, errors};

  const request: AstrologyGenerationRequest = {
    categoryId, language, generateAllZodiacs, inputs: {},
    promptType: category.promptType, outputSections: [...category.outputSections],
  };
  const period: Period = {};
  // Whitelist only the selected category's fields, even if a stale caller sends
  // hidden values from an earlier category. Never put display labels into IDs.
  for (const field of category.fields) {
    const raw = values[field.id];
    const value = typeof raw === 'string' ? raw.trim() : raw;
    if (value === undefined || value === '') continue;
    if (field.type === 'zodiac') {
      if (!generateAllZodiacs && isZodiacId(value)) request.zodiacId = value;
    } else if (field.id === 'extraInstruction') {
      request.extraInstruction = String(value);
    } else if (field.type === 'year') {
      period.year = Number(value);
    } else if (field.type === 'select' && field.periodKey === 'month') {
      period.month = Number(value);
    } else if (field.type === 'date' && field.periodKey) {
      period[field.periodKey] = String(value);
    } else {
      request.inputs[field.id] = value;
    }
  }
  if (Object.keys(period).length) request.period = period;
  if (values.includeBrand !== false && brand && (brand.businessName.trim() || brand.astrologerName.trim())) {
    request.brand = toBrandSnapshot({...emptyBrandProfile(), ...brand});
  }
  return {ok: true, request};
}
