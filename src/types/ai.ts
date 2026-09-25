import type {LanguageCode} from '../i18n';

export type AIProvider='openai'|'gemini'|'auto';

export interface GenerateContentRequest {
 category:string;
 zodiac?:string;
 language:LanguageCode;
 provider:AIProvider;
 tone?:'traditional'|'positive'|'premium'|'simple';
 extraInstruction?:string;
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
