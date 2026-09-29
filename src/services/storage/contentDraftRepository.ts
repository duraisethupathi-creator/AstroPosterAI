import {isLanguageCode} from '../../i18n';
import {getCategory, isAstrologyCategoryId} from '../../features/astrology/categories';
import {buildAstrologyRequest} from '../../features/astrology/requestBuilder';
import type {FormValues} from '../../features/astrology/types';
import {normalizeBrandProfile, toBrandSnapshot} from '../../types/brandProfile';
import {CONTENT_TONES, type ContentDraft, type StudioVersion} from '../../types/contentStudio';

export const CONTENT_DRAFTS_KEY = 'astroposter.contentDrafts.v1';
type Storage = {getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>};
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const date = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));

export function normalizeDraft(value: unknown): ContentDraft | null {
  if (!record(value) || typeof value.id !== 'string' || !/^[a-zA-Z0-9-]{1,100}$/.test(value.id) ||
    !date(value.createdAt) || !date(value.updatedAt) || value.status !== 'draft' || !record(value.request) || !record(value.version)) return null;
  const r = value.request, v = value.version;
  if (!isAstrologyCategoryId(r.categoryId) || !isLanguageCode(r.language) || !isLanguageCode(v.language) ||
    !CONTENT_TONES.includes(v.tone as never) || !['mock', 'live'].includes(String(v.mode)) || !record(v.content) ||
    !record(r.inputs) || r.generateAllZodiacs === true) return null;
  const category = getCategory(r.categoryId);
  const content = v.content;
  if (Object.keys(content).length !== category.outputSections.length || category.outputSections.some(key =>
    typeof content[key] !== 'string' || (content[key] as string).length > 700)) return null;
  const values: FormValues = {};
  for (const field of category.fields) {
    const raw = field.type === 'zodiac' ? r.zodiacId : field.id === 'extraInstruction' ? r.extraInstruction
      : 'periodKey' in field && field.periodKey ? (record(r.period) ? r.period[field.periodKey] : undefined) : r.inputs[field.id];
    if (raw !== undefined) {
      if (!['string', 'number', 'boolean'].includes(typeof raw) || (typeof raw === 'string' && raw.length > 2000)) return null;
      values[field.id] = raw as string | number | boolean;
    }
  }
  values.includeBrand = Boolean(r.brand);
  const built = buildAstrologyRequest({categoryId: category.id, language: r.language, values,
    brand: r.brand ? toBrandSnapshot(normalizeBrandProfile(r.brand)) : undefined});
  if (!built.ok) return null;
  return {id: value.id, createdAt: value.createdAt, updatedAt: value.updatedAt, status: 'draft', request: built.request,
    version: {language: v.language, tone: v.tone, mode: v.mode,
      content: Object.fromEntries(category.outputSections.map(key => [key, (v.content as Record<string, string>)[key]]))} as StudioVersion};
}

export function createContentDraftRepository(storage: Storage) {
  let queue: Promise<unknown> = Promise.resolve();
  async function read(): Promise<ContentDraft[]> {
    const raw = await storage.getItem(CONTENT_DRAFTS_KEY);
    if (raw === null) return [];
    // Never overwrite an unreadable document with an empty list on the next save.
    if (raw.length > 4000000) throw new Error('DRAFT_STORAGE_INVALID');
    const data: unknown = JSON.parse(raw);
    if (!record(data) || data.version !== 1 || !Array.isArray(data.drafts) || data.drafts.length > 100) throw new Error('DRAFT_STORAGE_INVALID');
    const drafts = data.drafts.map(normalizeDraft);
    if (drafts.some(draft => !draft) || new Set(drafts.map(draft => draft!.id)).size !== drafts.length) throw new Error('DRAFT_STORAGE_INVALID');
    return (drafts as ContentDraft[]).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  return {
    async list() { await queue; return read(); },
    save(input: ContentDraft) {
      const draft = normalizeDraft(input);
      if (!draft) return Promise.reject(new Error('DRAFT_INVALID'));
      const result = queue.then(async () => {
        const drafts = await read();
        const existing = drafts.find(item => item.id === draft.id);
        if (!existing && drafts.length >= 100) throw new Error('DRAFT_LIMIT');
        const saved = {...draft, createdAt: existing?.createdAt ?? draft.createdAt};
        const next = [saved, ...drafts.filter(item => item.id !== saved.id)];
        await storage.setItem(CONTENT_DRAFTS_KEY, JSON.stringify({version: 1, drafts: next}));
        return saved;
      });
      queue = result.catch(() => {});
      return result;
    },
  };
}
export type ContentDraftRepository = ReturnType<typeof createContentDraftRepository>;
