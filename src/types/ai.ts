import type {LanguageCode} from '../i18n';
import type {PosterCategoryId, ZodiacId} from '../config/categories';

export type AIProvider='openai'|'gemini'|'auto';

export interface GenerateContentRequest {
 category:PosterCategoryId;
 zodiac?:ZodiacId;
 language:LanguageCode;
 provider:AIProvider;
 tone?:'traditional'|'positive'|'premium'|'simple';
 extraInstruction?:string;
}

// Preparation only: no provider calls or generated content in Stage 2.
export function createGenerateContentRequest(
 language: LanguageCode,
 fields: Omit<GenerateContentRequest, 'language' | 'provider'>,
): GenerateContentRequest {
 return {...fields, language, provider: 'auto'};
}

export interface AstrologyContent {
 title:string;
 zodiac:string;
 date:string;
 general:string;
 career:string;
 finance:string;
 love:string;
 health:string;
 luckyNumber:string;
 luckyColour:string;
 positiveMessage:string;
 disclaimer?:string;
}
