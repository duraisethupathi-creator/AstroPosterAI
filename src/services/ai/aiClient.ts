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
  // Only a public backend URL is bundled. No provider credentials or SDKs.
  const baseUrl = options.baseUrl ?? process.env.EXPO_PUBLIC_AI_BASE_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL;
  const development = options.development ?? (typeof __DEV__ !== 'undefined' && __DEV__);
  let url: URL;
  try {
    url = new URL(baseUrl ?? '');
    if (url.username || url.password || url.search || url.hash ||
      !(url.protocol === 'https:' || (development && url.protocol === 'http:'))) throw new Error();
  } catch { throw new AIClientError('NOT_CONFIGURED'); }
  logAIEvent('request started', {backendOrigin: url.origin}, development);
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  if (options.signal?.aborted) throw new AIClientError('CANCELLED');
  options.signal?.addEventListener('abort', cancel, {once: true});
  // Backend local inference + optional repair share at most 60s; allow transport overhead.
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, options.timeoutMs ?? 75000);
  try {
    const wireRequest = {...request, brand: request.brand ? {...request.brand, logoUri: null, profilePhotoUri: null} : undefined};
    const response = await (options.fetcher ?? fetch)(`${url.toString().replace(/\/$/, '')}/api/ai/generate`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({request: wireRequest, action: options.action}), signal: controller.signal,
    });
    logAIEvent('HTTP status', {status: response.status}, development);
    const raw = await response.text();
    logAIEvent('response received', undefined, development);
    if (raw.length > 24000) throw new AIClientError('INVALID_RESPONSE');
    let body: unknown;
    try { body = JSON.parse(raw); } catch { throw new AIClientError('INVALID_RESPONSE'); }
    if (!response.ok) {
      const code = record(body) && record(body.error) ? body.error.code : undefined;
      if (AI_ERROR_CODES.some(allowed => allowed === code)) throw new AIClientError(code as AIErrorCode);
      throw new AIClientError('INVALID_RESPONSE');
    }
    return parseGenerationResult(body, request, options.action);
  } catch (error) {
    if (timedOut) throw new AIClientError('CLIENT_TIMEOUT');
    if (options.signal?.aborted) throw new AIClientError('CANCELLED');
    if (error instanceof AIClientError) throw error;
    throw new AIClientError('NETWORK_ERROR');
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', cancel);
  }
}
