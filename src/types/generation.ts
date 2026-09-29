import type {AstrologyGenerationRequest, OutputSectionId} from '../features/astrology/types';

export type GeneratedContent = Partial<Record<OutputSectionId, string>>;
export type AstrologyGenerationResult = Pick<AstrologyGenerationRequest, 'categoryId' | 'language' | 'zodiacId'> & {
  success: true;
  mode: 'mock' | 'live';
  content: GeneratedContent;
};
// Reserved contract only; Stage 5 accepts one sign per request.
export type AstrologyBatchResult = {success: true; results: AstrologyGenerationResult[]};
export const AI_ERROR_CODES = [
  'ZODIAC_MISMATCH',
  'INVALID_REQUEST', 'BULK_NOT_SUPPORTED', 'RATE_LIMITED', 'BODY_TOO_LARGE',
  'ORIGIN_DENIED', 'UNSUPPORTED_MEDIA_TYPE', 'NOT_FOUND', 'SERVER_ERROR', 'REQUEST_CANCELLED',
  'LOCAL_AI_NOT_RUNNING', 'LOCAL_AI_MODEL_NOT_FOUND', 'LOCAL_AI_TIMEOUT',
  'LOCAL_AI_INVALID_OUTPUT', 'LOCAL_AI_CONNECTION_ERROR',
] as const;
export type AIErrorCode = typeof AI_ERROR_CODES[number];
export type GenerationFailure = {success: false; error: {code: AIErrorCode}};
