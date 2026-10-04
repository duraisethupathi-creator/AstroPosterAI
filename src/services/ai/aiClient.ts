import {resultLanguage, type ContentAction} from '../../types/contentStudio';
import {getCategory} from '../../features/astrology/categories';
import type {AstrologyGenerationRequest} from '../../features/astrology/types';
import {AI_ERROR_CODES, type AstrologyGenerationResult, type AIErrorCode} from '../../types/generation';
import {logAIEvent} from './debug';
import {hasZodiacConflict} from '../../features/astrology/zodiacConsistency';

declare const __DEV__: boolean;

export type AIClientErrorCode = AIErrorCode | 'NETWORK_ERROR' | 'CLIENT_TIMEOUT' | 'INVALID_RESPONSE' | 'NOT_CONFIGURED' | 'CANCELLED';
export class AIClientError extends Error {
  constructor(public readonly code: AIClientErrorCode) { super(code); }
}
function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
export function parseGenerationResult(value: unknown, request: AstrologyGenerationRequest, action?: ContentAction): AstrologyGenerationResult {
  if (!record(value) || value.success !== true ||
    !['mock', 'live'].includes(String(value.mode)) || value.categoryId !== request.categoryId ||
    value.language !== resultLanguage(request, action) || value.zodiacId !== request.zodiacId || !record(value.content)) {
    throw new AIClientError('INVALID_RESPONSE');
  }
  const content = value.content;
  const sections = action?.sectionKey ? [action.sectionKey] : getCategory(request.categoryId).outputSections;
  if (Object.keys(content).length !== sections.length || sections.some(section =>
    typeof content[section] !== 'string' || !content[section].trim() || content[section].length > 700)) {
    throw new AIClientError('INVALID_RESPONSE');
  }
  if (hasZodiacConflict(content, request.zodiacId)) throw new AIClientError('ZODIAC_MISMATCH');
  return {success: true, mode: value.mode as 'mock' | 'live',
    categoryId: request.categoryId, language: resultLanguage(request, action), zodiacId: request.zodiacId,
    content: Object.fromEntries(sections.map(section => [section, content[section]]))};
}
type ClientOptions = {action?: ContentAction; baseUrl?: string; signal?: AbortSignal; timeoutMs?: number; fetcher?: typeof fetch; development?: boolean};
export async function generateAstrologyContent(request: AstrologyGenerationRequest, options: ClientOptions = {}) {
  if (request.generateAllZodiacs) throw new AIClientError('BULK_NOT_SUPPORTED');
  if (options.signal?.aborted) throw new AIClientError('CANCELLED');
  const language=resultLanguage(request, options.action);
  const sections=options.action?.sectionKey?[options.action.sectionKey]:getCategory(request.categoryId).outputSections;
  const current=options.action?.currentContent;
  const sign=request.zodiacId ? request.zodiacId.replace(/-/g,' ') : '';
  const ta=language==='ta';
  const defaults:Record<string,string>={
    general:ta?`இன்று ${sign} ராசிக்காரர்கள் அமைதியாக திட்டமிட்டு செயல்பட்டால் நல்ல முன்னேற்றம் காணலாம்.`:`Today brings steady progress for ${sign}. Plan calmly and act with confidence.`,
    career:ta?'வேலை மற்றும் தொழிலில் பொறுமையுடன் செயல்படுவது நல்ல பலன் தரும்.':'Patience and clear priorities support career progress today.',
    finance:ta?'செலவுகளை கவனித்து சேமிப்புக்கு முக்கியத்துவம் கொடுங்கள்.':'Watch expenses and give priority to sensible saving.',
    love:ta?'உறவுகளில் திறந்த மனதுடன் பேசுவது நல்ல புரிதலை உருவாக்கும்.':'Open communication can strengthen relationships.',
    health:ta?'ஓய்வு, தண்ணீர் மற்றும் ஒழுங்கான உணவில் கவனம் செலுத்துங்கள்.':'Prioritize rest, hydration and a balanced routine.',
    luckyNumber:'6', luckyColour:ta?'தங்க நிறம்':'Gold',
    positiveMessage:ta?'நம்பிக்கையுடன் முன்னேறுங்கள்; நல்ல மாற்றங்கள் உருவாகும்.':'Move forward with confidence and welcome positive change.',
    overview:ta?'இன்றைய சூழல் நிதானமான முன்னேற்றத்திற்கு ஏற்றதாக உள்ளது.':'The current period supports thoughtful, steady progress.',
    impact:ta?'மாற்றங்கள் புதிய வாய்ப்புகளை கவனிக்கச் செய்யும்.':'Changes may highlight useful new opportunities.',
    guidance:ta?'முக்கிய முடிவுகளை நிதானமாக எடுத்துக்கொள்ளுங்கள்.':'Take important decisions calmly and thoughtfully.',
    remedy:ta?'தினமும் சில நிமிடங்கள் அமைதியான பிரார்த்தனை அல்லது தியானம் செய்யுங்கள்.':'Spend a few quiet minutes in prayer or reflection.',
    title:ta?'இன்றைய ஜோதிட வழிகாட்டல்':'Today’s Astrology Guidance',
    greeting:ta?'இனிய வாழ்த்துகள்!':'Warm wishes!',
    message:ta?'நல்ல எண்ணங்களும் மகிழ்ச்சியும் உங்கள் நாளை நிறைக்கட்டும்.':'May positivity and happiness fill your day.',
    cta:ta?'மேலும் ஜோதிட தகவல்களுக்கு தொடர்ந்து பாருங்கள்.':'Follow for more astrology updates.',
    headline:ta?'உங்கள் ஜோதிட வழிகாட்டல் இன்று':'Your Astrology Guidance Today',
    description:ta?'எளிய மற்றும் தெளிவான ஜோதிட தகவல்களைப் பெறுங்கள்.':'Get simple and clear astrology guidance.',
    blessing:ta?'முருகன் அருள் உங்கள் வாழ்வில் நன்மைகளை பெருக்கட்டும்.':'May divine grace bring goodness to your life.',
    tips:ta?'இன்றைய நாளை திட்டமிட்டு, முக்கிய பணிகளுக்கு முன்னுரிமை கொடுங்கள்.':'Plan the day and prioritize what matters most.'
  };
  const content=Object.fromEntries(sections.map(section=>[section,
    options.action?.sectionKey && current?.[section] ? current[section]! : defaults[section] ?? (ta?'நல்ல எண்ணங்களுடன் நாளை முன்னெடுங்கள்.':'Move through the day with a positive mindset.')
  ]));
  const result={success:true,mode:'mock',categoryId:request.categoryId,language,zodiacId:request.zodiacId,content};
  return parseGenerationResult(result,request,options.action);
}
