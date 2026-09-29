import assert from 'node:assert/strict';
import {test} from 'node:test';
import {once} from 'node:events';
import {createGateway} from '../src/ai/gateway';
import {LocalAIProvider} from '../src/ai/localProvider';
import {readEnv} from '../src/config/env';
import {parseGenerationBody} from '../src/validation/generationRequest';
import {buildPrompt} from '../src/ai/promptBuilder';
import {createApp} from '../src/app';
import {generateAstrologyContent, parseGenerationResult} from '../../src/services/ai/aiClient';
import {CONTENT_TONES, type ContentAction, type ContentDraft} from '../../src/types/contentStudio';
import {createContentStudioStore, isStudioDirty} from '../../src/state/contentStudioStore';
import {CONTENT_DRAFTS_KEY, createContentDraftRepository, normalizeDraft} from '../../src/services/storage/contentDraftRepository';
import {getCategory, ASTROLOGY_CATEGORIES} from '../../src/features/astrology/categories';
import {createCategoryForm} from '../../src/features/astrology/formState';
import {buildAstrologyRequest} from '../../src/features/astrology/requestBuilder';
import {SUPPORTED_LANGUAGES} from '../../src/i18n';
import type {AstrologyGenerationResult} from '../../src/types/generation';

const request = parseGenerationBody({request: {categoryId: 'daily', language: 'ta', zodiacId: 'aries', period: {date: '2026-09-28'}, inputs: {}, extraInstruction: 'Be kind'}}).request;
const content = Object.fromEntries(getCategory('daily').outputSections.map(key => [key, key === 'luckyNumber' ? '8' : `${key} original`]));
const result: AstrologyGenerationResult = {success: true, mode: 'live', categoryId: 'daily', language: 'ta', zodiacId: 'aries', content};
const env = readEnv({NODE_ENV: 'test'});
const action = (changes: Partial<ContentAction> = {}): ContentAction => ({operation: 'shorten', language: 'ta', currentContent: content, sectionKey: 'career', ...changes});
function memory() {
  const values = new Map<string, string>();
  return {values, async getItem(key: string) {return values.get(key) ?? null;}, async setItem(key: string, value: string) {values.set(key, value);}};
}
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {resolve = yes; reject = no;});
  return {promise, resolve, reject};
}

test('Studio action validation rejects arbitrary operations, sections, languages, oversized content and cross-category schemas', () => {
  for (const changes of [
    {operation: 'delete'}, {sectionKey: 'headline'}, {tone: 'angry'}, {language: 'fr'},
    {operation: 'translate'}, {operation: 'translate', targetLanguage: 'en'},
    {targetLanguage: 'en'}, {operation: 'changeTone', tone: undefined},
    {currentContent: {career: 'incomplete'}}, {currentContent: {...content, career: 'a'.repeat(701)}},
  ]) assert.throws(() => parseGenerationBody({request, action: {...action(), ...changes}}), {code: 'INVALID_REQUEST'});
  assert.equal(parseGenerationBody({request, action: action()}).action?.sectionKey, 'career');
  assert.equal(parseGenerationBody({request, action: action({operation: 'translate', targetLanguage: 'en', sectionKey: undefined})}).action?.targetLanguage, 'en');
});

test('section local inference requests only its schema and retains controlled repair', async () => {
  let calls = 0;
  const local = new LocalAIProvider(env, async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    assert.deepEqual(body.format.required, ['career']);
    const payload = JSON.parse(body.messages[1].content.split('\nRequired JSON schema:')[0]);
    assert.deepEqual(payload.currentContent, {career: content.career});
    assert.equal(payload.zodiac, 'aries');
    const text = ++calls === 1 ? JSON.stringify({career: 'New', finance: 'Must not change'}) : JSON.stringify({career: 'Short text'});
    return new Response(JSON.stringify({done: true, message: {content: text}}));
  });
  const output = await createGateway(env, local)({request, action: action()});
  assert.deepEqual(output.content, {career: 'Short text'});
  assert.equal(calls, 2);
  assert.deepEqual(parseGenerationResult(output, request, action()).content, output.content);
  assert.throws(() => parseGenerationResult({...output, content: {...output.content, finance: 'unexpected'}}, request, action()));
});

test('full rewrite protects lucky values; translation preserves number and context while changing content language only', async () => {
  const gateway = createGateway(env, {async generate() {return {...content, luckyNumber: '999', luckyColour: 'new colour'};}});
  const improved = await gateway({request, action: action({operation: 'improve', sectionKey: undefined})});
  assert.equal(improved.content.luckyNumber, '8'); assert.equal(improved.content.luckyColour, content.luckyColour);
  const translated = await gateway({request, action: action({operation: 'translate', sectionKey: undefined, targetLanguage: 'en'})});
  assert.equal(translated.language, 'en'); assert.equal(translated.content.luckyNumber, '8');
  assert.equal(request.language, 'ta'); assert.equal(translated.zodiacId, 'aries');
  const regenerated = await gateway({request, action: action({operation: 'regenerate', sectionKey: undefined, language: 'en'})});
  assert.equal(regenerated.language, 'ta'); assert.equal(regenerated.content.luckyNumber, '999');
});

test('all six languages and tones use the shared prompt engine; original context survives regeneration', () => {
  for (const {code} of SUPPORTED_LANGUAGES) for (const tone of CONTENT_TONES) {
    const prompt = buildPrompt(request, action({operation: 'changeTone', language: code, tone}));
    assert.match(prompt.instructions, /preserving meaning and facts/);
    assert.equal(JSON.parse(prompt.input).language, code);
  }
  const prompt = buildPrompt(request, action({operation: 'regenerate', sectionKey: undefined}));
  const payload = JSON.parse(prompt.input);
  assert.equal(payload.extraInstruction, request.extraInstruction);
  assert.deepEqual(payload.period, request.period);
  assert.equal(payload.currentContent, undefined);
});

test('session preserves unrelated manual edits during section AI; conflicting edits and failures never erase text', async () => {
  let pending = deferred<AstrologyGenerationResult>(); let calls = 0;
  const store = createContentStudioStore(createContentDraftRepository(memory()), async () => {calls++; return pending.promise;});
  store.start(request, result);
  const task = store.run({operation: 'shorten', sectionKey: 'career'});
  await store.run({operation: 'improve'}); assert.equal(calls, 1);
  store.edit('finance', 'Manual finance');
  pending.resolve({...result, content: {career: 'Short career'}}); await task;
  assert.equal(store.getSnapshot().session!.version.content.finance, 'Manual finance');
  assert.equal(store.getSnapshot().session!.version.content.career, 'Short career');
  store.undo(); assert.equal(store.getSnapshot().session!.version.content.career, content.career);
  assert.equal(store.getSnapshot().session!.version.content.finance, 'Manual finance');
  store.redo(); assert.equal(store.getSnapshot().session!.version.content.career, 'Short career');
  pending = deferred(); const next = store.run({operation: 'improve', sectionKey: 'career'});
  store.edit('career', 'Newer edit'); pending.resolve({...result, content: {career: 'Late result'}}); await next;
  assert.equal(store.getSnapshot().session!.version.content.career, 'Newer edit');
  assert.equal(store.getSnapshot().error, 'studio.changedDuringAction');
  pending = deferred(); const failing = store.retry(); pending.reject(new Error('secret provider error')); await failing;
  assert.equal(store.getSnapshot().session!.version.content.career, 'Newer edit');
  assert.equal(store.getSnapshot().error, 'studio.updateFailed');
});

test('whole actions detect edits; history is bounded; switching sessions rejects stale results', async () => {
  const pending = deferred<AstrologyGenerationResult>();
  const repository = createContentDraftRepository(memory());
  const store = createContentStudioStore(repository, async () => pending.promise);
  store.start(request, result); const task = store.run({operation: 'improve'});
  store.edit('career', 'Keep this'); pending.resolve(result); await task;
  assert.equal(store.getSnapshot().session!.version.content.career, 'Keep this');
  const wait = deferred<AstrologyGenerationResult>();
  const other = createContentStudioStore(repository, async () => wait.promise);
  other.start(request, result); const old = other.run({operation: 'improve'});
  other.start({...request, zodiacId: 'taurus'}, {...result, zodiacId: 'taurus', content: {...content, career: 'New session'}});
  wait.resolve(result); await old;
  assert.equal(other.getSnapshot().session!.version.content.career, 'New session');
  const bounded = createContentStudioStore(repository, async () => result); bounded.start(request, result);
  for (let i = 0; i < 25; i++) await bounded.run({operation: 'improve'});
  assert.equal(bounded.getSnapshot().session!.past.length, 20);
});

test('Tamil and English workflows retain edit/history, source context, draft state and immutable design payload', async () => {
  const storage = memory(), repository = createContentDraftRepository(storage);
  const store = createContentStudioStore(repository, async (original, options) => ({...result,
    language: options.action.targetLanguage ?? options.action.language,
    content: options.action.sectionKey ? {[options.action.sectionKey]: 'Changed section'} : {...content, general: 'Changed whole result'},
    zodiacId: original.zodiacId}));
  store.start(request, result);
  await store.run({operation: 'shorten', sectionKey: 'career'});
  await store.run({operation: 'changeTone', tone: 'positive'});
  assert.equal(store.getSnapshot().session!.version.tone, 'positive');
  await store.run({operation: 'nativeLanguage'}); store.edit('career', 'Manual Tamil'); store.undo();
  await store.save(); assert.equal(isStudioDirty(store.getSnapshot()), false);
  const drafts = await createContentDraftRepository(storage).list(); assert.equal(drafts.length, 1);
  const reopened = createContentStudioStore(repository, async () => result); reopened.open(drafts[0]);
  assert.deepEqual(reopened.getSnapshot().session!.request, request);
  const payload = reopened.toDesign()!; reopened.edit('career', 'Later edit');
  assert.notEqual(payload.version.content.career, 'Later edit'); assert.equal(payload.request.zodiacId, 'aries');
  store.start({...request, language: 'en'}, {...result, language: 'en'});
  await store.run({operation: 'improve'}); await store.run({operation: 'expand', sectionKey: 'career'});
  await store.run({operation: 'translate', targetLanguage: 'ta'});
  assert.equal(store.getSnapshot().session!.version.language, 'ta');
  assert.equal(store.getSnapshot().session!.request.language, 'en');
  store.undo(); assert.equal(store.getSnapshot().session!.version.language, 'en');
});

test('draft repository survives restart, serializes saves, rejects corruption and permits manual empty fields', async () => {
  const storage = memory(); const repository = createContentDraftRepository(storage);
  assert.deepEqual(await repository.list(), []);
  const now = new Date().toISOString();
  const draft: ContentDraft = {id: 'one', createdAt: now, updatedAt: now, status: 'draft', request, version: {content: {...content, career: ''}, language: 'ta', tone: 'simple', mode: 'live'}};
  await Promise.all([repository.save(draft), repository.save({...draft, id: 'two'})]);
  assert.equal((await createContentDraftRepository(storage).list()).length, 2);
  assert.equal(normalizeDraft({...draft, request: {...request, categoryId: 'fake'}}), null);
  assert.equal(normalizeDraft({...draft, version: {...draft.version, content: {...content, extra: 'bad'}}}), null);
  storage.values.set(CONTENT_DRAFTS_KEY, '{broken');
  await assert.rejects(repository.save(draft)); assert.equal(storage.values.get(CONTENT_DRAFTS_KEY), '{broken');
});

test('storage failure retains text; edits during save remain dirty and repeated saves update one draft', async () => {
  let fail = true; const storage = memory(); const saved = deferred<void>();
  const repo = createContentDraftRepository({...storage, async setItem(key, value) {if (fail) throw Error('full'); await saved.promise; return storage.setItem(key, value);}});
  const store = createContentStudioStore(repo, async () => result); store.start(request, result);
  await store.save(); assert.equal(store.getSnapshot().saveError, true); assert.deepEqual(store.getSnapshot().session!.version.content, content);
  fail = false; const task = store.save(); store.edit('career', 'While saving'); saved.resolve(); await task;
  assert.equal(isStudioDirty(store.getSnapshot()), true); await store.save();
  assert.equal(isStudioDirty(store.getSnapshot()), false); assert.equal((await repo.list()).length, 1);
});

test('HTTP Studio operations use the same mobile client, mock route and normalized response', async () => {
  const mockEnv = {...env, AI_MOCK_MODE: true};
  const server = createApp(mockEnv, createGateway(mockEnv)).listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  try {
    const options = {baseUrl: `http://127.0.0.1:${address.port}`, development: true};
    const section = await generateAstrologyContent(request, {...options, action: action()});
    assert.deepEqual(Object.keys(section.content), ['career']);
    const translated = await generateAstrologyContent(request, {...options, action: action({operation: 'translate', targetLanguage: 'en', sectionKey: undefined})});
    assert.equal(translated.language, 'en'); assert.equal(translated.content.luckyNumber, '8');
  } finally {await new Promise<void>(resolve => server.close(() => resolve()));}
});

test('all category drafts round-trip original context and every section action uses its own contract', async () => {
  const gateway = createGateway({...env, AI_MOCK_MODE: true});
  for (const category of ASTROLOGY_CATEGORIES) {
    const form = createCategoryForm(category.id);
    for (const field of getCategory(category.id).fields) {
      if (field.type === 'zodiac') form.values[field.id] = 'aries';
      else if (field.type === 'select') form.values[field.id] = field.options[0].value;
      else if (field.required && (field.type === 'text' || field.type === 'multiline')) form.values[field.id] = 'Sample';
    }
    const built = buildAstrologyRequest({...form, language: 'en'}); assert.ok(built.ok);
    const original = await gateway({request: built.request});
    const now = new Date().toISOString();
    const draft = normalizeDraft({id: category.id, createdAt: now, updatedAt: now, status: 'draft', request: built.request,
      version: {content: original.content, language: 'en', tone: 'premium', mode: 'mock'}});
    assert.ok(draft); assert.deepEqual(draft.request, built.request);
    for (const section of category.outputSections) {
      const body = parseGenerationBody({request: built.request, action: {operation: 'rewrite', language: 'en', currentContent: original.content, sectionKey: section}});
      const output = await gateway(body); assert.deepEqual(Object.keys(output.content), [section]);
    }
  }
});
