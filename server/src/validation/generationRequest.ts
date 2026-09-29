import {z} from 'zod';
import {getCategory, isAstrologyCategoryId} from '../../../src/features/astrology/categories';
import {isZodiacId} from '../../../src/features/astrology/zodiac';
import {validateCategory} from '../../../src/features/astrology/validation';
import type {AstrologyGenerationRequest, FormValues} from '../../../src/features/astrology/types';
import {isLanguageCode} from '../../../src/i18n';
import {ApiError} from '../middleware/errorHandler';
import {CONTENT_OPERATIONS, CONTENT_TONES, type ContentAction} from '../../../src/types/contentStudio';

const text = z.string().trim().max(2000);
const brand = z.object({
  businessName: text, astrologerName: text, phone: text, whatsapp: text,
  address: text, website: text,
  logoUri: z.string().max(4096).nullable(), profilePhotoUri: z.string().max(4096).nullable(),
}).strict();
const bodySchema = z.object({
  action: z.object({
    operation: z.enum(CONTENT_OPERATIONS).refine(value => value !== 'generate'),
    language: z.string().refine(isLanguageCode),
    currentContent: z.record(z.string().max(40), z.string().max(700)),
    sectionKey: z.string().max(40).optional(),
    tone: z.enum(CONTENT_TONES).optional(),
    targetLanguage: z.string().refine(isLanguageCode).optional(),
  }).strict().optional(),
  request: z.object({
    categoryId: z.string().refine(isAstrologyCategoryId),
    language: z.string().refine(isLanguageCode),
    zodiacId: z.string().refine(isZodiacId).optional(),
    generateAllZodiacs: z.boolean().default(false),
    period: z.object({date: text.optional(), week: text.optional(), month: z.number().int().optional(), year: z.number().int().optional()}).strict().optional(),
    inputs: z.record(z.string().max(40), z.union([text, z.number().finite(), z.boolean()])),
    extraInstruction: text.optional(),
    brand: brand.optional(),
    // Accepted for Stage 4 compatibility, but never trusted as instructions/schema.
    promptType: z.string().max(40).optional(),
    outputSections: z.array(z.string().max(40)).max(20).optional(),
  }).strict(),
}).strict();

export function parseGenerationBody(body: unknown) {
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, 'INVALID_REQUEST');
  const {request: input} = parsed.data;
  if (input.generateAllZodiacs) throw new ApiError(422, 'BULK_NOT_SUPPORTED');
  if (!isAstrologyCategoryId(input.categoryId) || !isLanguageCode(input.language)) throw new ApiError(400, 'INVALID_REQUEST');
  const category = getCategory(input.categoryId);
  const allowedInputs = new Set<string>();
  const allowedPeriod = new Set<string>();
  const values: FormValues = {};
  let allowsZodiac = false;
  for (const field of category.fields) {
    if (field.type === 'zodiac') { allowsZodiac = true; values[field.id] = input.zodiacId; }
    else if (field.id === 'extraInstruction') values[field.id] = input.extraInstruction;
    else if ('periodKey' in field && field.periodKey) {
      allowedPeriod.add(field.periodKey);
      values[field.id] = input.period?.[field.periodKey];
    } else { allowedInputs.add(field.id); values[field.id] = input.inputs[field.id]; }
  }
  if ((!allowsZodiac && input.zodiacId) || Object.keys(input.inputs).some(key => !allowedInputs.has(key)) ||
    Object.keys(input.period ?? {}).some(key => !allowedPeriod.has(key)) ||
    Object.keys(validateCategory(category, values)).length) throw new ApiError(400, 'INVALID_REQUEST');
  if ((input.promptType && input.promptType !== category.promptType) ||
    (input.outputSections && JSON.stringify(input.outputSections) !== JSON.stringify(category.outputSections))) {
    throw new ApiError(400, 'INVALID_REQUEST');
  }
  const request: AstrologyGenerationRequest = {
    ...input, categoryId: input.categoryId, language: input.language,
    zodiacId: isZodiacId(input.zodiacId) ? input.zodiacId : undefined,
    promptType: category.promptType, outputSections: category.outputSections,
  };
  const action = parsed.data.action;
  if (action) {
    const keys = category.outputSections as readonly string[];
    if (Object.keys(action.currentContent).length !== keys.length || keys.some(key => !(key in action.currentContent)) ||
      (action.sectionKey && !keys.includes(action.sectionKey)) ||
      (['regenerate', 'translate'].includes(action.operation) && action.sectionKey) ||
      (action.operation === 'translate' ? !action.targetLanguage : Boolean(action.targetLanguage)) ||
      (action.operation === 'changeTone' && !action.tone) ||
      (!action.sectionKey && action.operation !== 'regenerate' && keys.some(key => !action.currentContent[key].trim()))) {
      throw new ApiError(400, 'INVALID_REQUEST');
    }
  }
  return {request, ...(action ? {action: action as ContentAction} : {})};
}
