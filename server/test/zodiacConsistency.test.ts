import assert from 'node:assert/strict';
import {test} from 'node:test';
import {hasZodiacConflict} from '../../src/features/astrology/zodiacConsistency';
import {ZODIACS} from '../../src/features/astrology/zodiac';
import {SUPPORTED_LANGUAGES, translate} from '../../src/i18n';
import {getCategory} from '../../src/features/astrology/categories';
import {parseGenerationResult} from '../../src/services/ai/aiClient';
import {createContentStudioStore} from '../../src/state/contentStudioStore';
import {createContentDraftRepository} from '../../src/services/storage/contentDraftRepository';
import {readEnv} from '../src/config/env';
import {LocalAIProvider} from '../src/ai/localProvider';
import {MockProvider} from '../src/ai/mockProvider';
import {createGateway} from '../src/ai/gateway';
import {generationSeed} from '../src/ai/generationSeed';
import {parseGenerationBody} from '../src/validation/generationRequest';

const env = readEnv({NODE_ENV: 'test', AI_MOCK_MODE: 'false'});
const request = (zodiacId = 'aries', language = 'en') => parseGenerationBody({request: {
  categoryId: 'daily', language, zodiacId, period: {date: '2026-09-29'}, inputs: {},
}}).request;
const content = Object.fromEntries(getCategory('daily').outputSections.map(key => [key, 'Keep a steady pace.']));
const response = (value: typeof content) => new Response(JSON.stringify({done: true, message: {content: JSON.stringify(value)}}));

test('all six languages: every section rejects all eleven wrong signs and accepts its own sign', () => {
  for (const language of SUPPORTED_LANGUAGES) for (const selected of ZODIACS) for (const mentioned of ZODIACS) {
    for (const section of getCategory('daily').outputSections) {
      const value = {...content, [section]: `${translate(language.code, mentioned.translationKey)}: text`};
      assert.equal(hasZodiacConflict(value, selected.id), selected.id !== mentioned.id,
        `${language.code}/${selected.id}/${mentioned.id}/${section}`);
    }
  }
});

test('Tamil inflections, romanized names, symbols and mixed-language leaks are detected without Latin substring false positives', () => {
  for (const name of ['கும்பராசிக்காரர்கள்', 'கும்பத்தினரே', 'Kumbam', 'कुम्भ', 'కుంభరాశి', 'ಕುಂಭ', 'കുംഭം', '♒', 'Aquarius']) {
    assert.equal(hasZodiacConflict({general: name}, 'aries'), true, name);
  }
  assert.equal(hasZodiacConflict({general: 'மேஷ ராசிக்காரர்களே'}, 'aries'), false);
  assert.equal(hasZodiacConflict({general: 'கும்ப ராசிக்காரர்களே'}, 'aquarius'), false);
  assert.equal(hasZodiacConflict({general: 'Leonard visits a library.'}, 'aries'), false);
});

test('seed is deterministic, property-order independent and zodiac-aware', () => {
  const aries = request();
  assert.equal(generationSeed(aries), generationSeed({...aries, inputs: {...aries.inputs}}));
  assert.equal(generationSeed(aries), generationSeed(Object.fromEntries(Object.entries(aries).reverse()) as typeof aries));
  assert.notEqual(generationSeed(aries), generationSeed(request('aquarius')));
  assert.notEqual(generationSeed(aries), generationSeed(request('aries', 'ta')));
});

test('Aries English, Aquarius English, Mesham Tamil and Kumbam Tamil are stable zodiac-aware local requests', async () => {
  for (const [sign, language] of [['aries','en'], ['aquarius','en'], ['aries','ta'], ['aquarius','ta']]) {
    const r = request(sign, language);
    const signName = translate(r.language, ZODIACS.find(item => item.id === r.zodiacId)!.translationKey);
    const local = new LocalAIProvider(env, async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      assert.equal(payload.options.seed, generationSeed(r));
      assert.equal(payload.options.temperature, 0);
      assert.ok(payload.messages[0].content.includes(`selected zodiac ID ${sign}`));
      return response({...content, general: `${signName}: steady progress.`});
    });
    const gateway = createGateway(env, local);
    const first = await gateway({request: r});
    assert.deepEqual(await gateway({request: r}), first);
    assert.equal(hasZodiacConflict(first.content, r.zodiacId), false);
    assert.deepEqual(parseGenerationResult(first, r), first);
  }
});

test('incorrect zodiac gets exactly one repair, then is rejected without displaying content', async () => {
  for (const repairsSuccessfully of [true, false]) {
    let calls = 0;
    const local = new LocalAIProvider(env, async (_url, init) => {
      calls++;
      const payload = JSON.parse(String(init?.body));
      if (calls === 2) assert.match(payload.messages.at(-1).content, /ONLY permitted zodiac is aries/);
      return response({...content, career: calls === 2 && repairsSuccessfully ? 'Aries: steady work.' : 'Aquarius: steady work.'});
    });
    if (repairsSuccessfully) assert.equal(hasZodiacConflict(await local.generate(request(), new AbortController().signal), 'aries'), false);
    else await assert.rejects(local.generate(request(), new AbortController().signal), {code: 'ZODIAC_MISMATCH'});
    assert.equal(calls, 2);
  }
});

test('gateway, mobile parser and design handoff independently reject inconsistent content; edits remain recoverable', async () => {
  const wrong = {...content, general: 'Aquarius has a busy day.'};
  await assert.rejects(createGateway(env, {generate: async () => wrong})({request: request()}), {code: 'ZODIAC_MISMATCH'});
  const result = {success: true as const, mode: 'live' as const, categoryId: 'daily' as const, language: 'en' as const, zodiacId: 'aries' as const, content: wrong};
  assert.throws(() => parseGenerationResult(result, request()), {code: 'ZODIAC_MISMATCH'});
  const repo = createContentDraftRepository({getItem: async () => null, setItem: async () => {}});
  const studio = createContentStudioStore(repo, async () => result);
  studio.start(request(), {...result, content});
  studio.edit('general', wrong.general);
  assert.equal(studio.toDesign(), undefined);
  assert.equal(studio.getSnapshot().session!.version.content.general, wrong.general);
  studio.edit('general', 'Aries has a busy day.');
  assert.ok(studio.toDesign());
  await studio.run({operation: 'improve', sectionKey: 'career'});
  assert.equal(studio.getSnapshot().error, 'preview.zodiacMismatch');
  assert.equal(studio.getSnapshot().session!.version.content.general, 'Aries has a busy day.');
});

test('mock generator is repeatable and sign-aware across 12 signs and six languages', async () => {
  const mock = new MockProvider();
  for (const sign of ZODIACS) for (const language of SUPPORTED_LANGUAGES) {
    const r = request(sign.id, language.code);
    const first = await mock.generate(r);
    assert.deepEqual(await mock.generate(r), first);
    assert.ok(first.general!.includes(translate(language.code, sign.translationKey)));
    assert.equal(hasZodiacConflict(first, sign.id), false);
  }
});
