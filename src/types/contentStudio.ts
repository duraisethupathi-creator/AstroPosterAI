import type {LanguageCode} from '../i18n';
import type {AstrologyGenerationRequest, OutputSectionId} from '../features/astrology/types';
import type {AstrologyGenerationResult, GeneratedContent} from './generation';

export const CONTENT_TONES = ['simple', 'traditional', 'positive', 'premium'] as const;
export type ContentTone = typeof CONTENT_TONES[number];
export const CONTENT_OPERATIONS = ['generate', 'regenerate', 'rewrite', 'shorten', 'expand', 'improve', 'changeTone', 'translate', 'nativeLanguage'] as const;
export type ContentOperation = typeof CONTENT_OPERATIONS[number];
export type ContentAction = {
  operation: Exclude<ContentOperation, 'generate'>;
  language: LanguageCode;
  currentContent: GeneratedContent;
  sectionKey?: OutputSectionId;
  tone?: ContentTone;
  targetLanguage?: LanguageCode;
};
export type StudioVersion = Pick<AstrologyGenerationResult, 'content' | 'language' | 'mode'> & {tone: ContentTone};
export type ContentDraft = {
  id: string; createdAt: string; updatedAt: string; status: 'draft';
  request: AstrologyGenerationRequest;
  version: StudioVersion;
};
export type DesignContent = {request: AstrologyGenerationRequest; version: StudioVersion; draftId?: string};

export function resultLanguage(request: AstrologyGenerationRequest, action?: ContentAction): LanguageCode {
  return !action || action.operation === 'regenerate' ? request.language
    : action.operation === 'translate' ? action.targetLanguage! : action.language;
}

// Numbers and colours are values, not wording to embellish. Translation/native
// cleanup may translate a colour's name, but must retain its meaning in the prompt.
export function preserveStructuredValues(content: GeneratedContent, action?: ContentAction): GeneratedContent {
  if (!action || action.operation === 'regenerate') return content;
  const result = {...content};
  for (const key of ['luckyNumber', 'luckyColour'] as const) {
    if (key === 'luckyColour' && ['translate', 'nativeLanguage'].includes(action.operation)) continue;
    if (key in result && action.currentContent[key] !== undefined) result[key] = action.currentContent[key];
  }
  return result;
}
