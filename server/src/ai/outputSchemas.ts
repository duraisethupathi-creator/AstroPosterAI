import {z} from 'zod';
import {getCategory, type AstrologyCategoryId} from '../../../src/features/astrology/categories';
import type {GeneratedContent} from '../../../src/types/generation';
import {ApiError} from '../middleware/errorHandler';

export function outputSchema(categoryId: AstrologyCategoryId) {
  return z.object(Object.fromEntries(getCategory(categoryId).outputSections.map(section => [section, z.string().trim().min(1).max(700)]))).strict();
}
export function outputJsonSchema(categoryId: AstrologyCategoryId) {
  const sections = getCategory(categoryId).outputSections;
  return {type: 'object', properties: Object.fromEntries(sections.map(key => [key, {type: 'string'}])),
    required: [...sections], additionalProperties: false};
}
export function validateOutput(categoryId: AstrologyCategoryId, data: unknown): GeneratedContent {
  const result = outputSchema(categoryId).safeParse(data);
  if (!result.success) throw new ApiError(502, 'LOCAL_AI_INVALID_OUTPUT');
  return result.data;
}
export function parseOutput(categoryId: AstrologyCategoryId, raw: string | undefined): GeneratedContent {
  if (!raw || raw.length > 20000) throw new ApiError(502, 'LOCAL_AI_INVALID_OUTPUT');
  // Accept a single full JSON fence, not arbitrary prose or multiple objects.
  const clean = raw.trim().replace(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i, '$1').trim();
  let value: unknown;
  try { value = JSON.parse(clean); } catch { throw new ApiError(502, 'LOCAL_AI_INVALID_OUTPUT'); }
  return validateOutput(categoryId, value);
}
