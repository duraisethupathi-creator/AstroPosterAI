import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {readEnv} from '../src/config/env';
import {LocalAIProvider} from '../src/ai/localProvider';
import {createGateway} from '../src/ai/gateway';
import {parseGenerationBody} from '../src/validation/generationRequest';
import {parseOutput, outputJsonSchema} from '../src/ai/outputSchemas';
import {buildPrompt} from '../src/ai/promptBuilder';
import {markTiming, timedRequest} from '../src/ai/timing';
import {SUPPORTED_LANGUAGES} from '../../src/i18n';
import {ASTROLOGY_CATEGORIES, getCategory} from '../../src/features/astrology/categories';

const env = readEnv({NODE_ENV: 'test', AI_MOCK_MODE: 'false'});
const daily = (language = 'en') => parseGenerationBody({request: {categoryId: 'daily', language,
  zodiacId: 'aries', period: {date: '2026-09-28'}, inputs: {}}}).request;
const content = Object.fromEntries(getCategory('daily').outputSections.map(key => [key, 'Short sample.']));
const response = (raw = JSON.stringify(content)) => new Response(JSON.stringify({done: true, message: {content: raw}}));
const signal = () => new AbortController().signal;

test('local configuration validates origin/model/deadline; no credentials or paid config in parsed env', () => {
  assert.equal(env.LOCAL_AI_MODEL, 'qwen3.5:2b-q4_K_M');
  assert.equal(env.AI_MOCK_MODE, false);
  assert.ok(!Object.keys(env).some(key => /API_KEY|OPENAI|GEMINI/.test(key)));
  for (const url of ['file:///tmp/model', 'http://user:pass@host', 'http://host/api', 'http://host?key=secret']) {
    assert.throws(() => readEnv({LOCAL_AI_BASE_URL: url}));
  }
  assert.throws(() => readEnv({LOCAL_AI_MODEL: 'qwen3:cloud'}));
  assert.throws(() => readEnv({LOCAL_AI_TIMEOUT_MS: '75000'}));
});

test('all six language requests use native Ollama schema and strip provider metadata', async () => {
  for (const {code} of SUPPORTED_LANGUAGES) {
    let calls = 0;
    const local = new LocalAIProvider(env, async (url, init) => {
      calls++;
      assert.equal(url, 'http://127.0.0.1:11434/api/chat');
      const body = JSON.parse(String(init?.body));
      assert.equal(body.model, env.LOCAL_AI_MODEL);
      assert.equal(body.stream, false);
      assert.equal(body.think, false);
      assert.equal(body.options.num_ctx, 4096);
      assert.deepEqual(body.format, outputJsonSchema('daily'));
      assert.ok(body.messages[1].content.includes(`"language":"${code}"`));
      assert.deepEqual(init?.headers, {'Content-Type': 'application/json'});
      return response();
    });
    const result = await createGateway(env, local)({request: daily(code)});
    assert.equal(result.language, code);
    assert.equal(result.mode, 'live');
    assert.equal('provider' in result, false);
    assert.equal('model' in result, false);
    assert.equal(calls, 1);
  }
});

test('all Stage 4 categories retain distinct structured contracts', async () => {
  for (const category of ASTROLOGY_CATEGORIES) {
    const sections = Object.fromEntries(category.outputSections.map(section => [section, 'Valid text']));
    assert.deepEqual(parseOutput(category.id, JSON.stringify(sections)), sections);
    assert.deepEqual(outputJsonSchema(category.id).required, [...category.outputSections]);
  }
});

test('single full JSON fence is accepted; prose, extra keys and missing keys require one repair', async () => {
  assert.deepEqual(parseOutput('daily', '```json\n' + JSON.stringify(content) + '\n```'), content);
  for (const invalid of ['not JSON', 'Here is the result: ' + JSON.stringify(content), '{}', JSON.stringify({...content, extra: 'bad'})]) {
    let calls = 0;
    const local = new LocalAIProvider(env, async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      if (calls++ === 0) return response(invalid);
      assert.match(body.messages.at(-1).content, /Repair/);
      assert.deepEqual(body.format, outputJsonSchema('daily'));
      return response();
    });
    assert.deepEqual(await local.generate(daily(), signal()), content);
    assert.equal(calls, 2);
  }
});

test('invalid envelope, malformed JSON, empty and overlong fields never cause infinite repairs', async () => {
  for (const makeResponse of [
    () => new Response('broken'),
    () => new Response(JSON.stringify({done: false, message: {content: '{}'}})),
    () => response('{}'),
    () => response(JSON.stringify({...content, general: ''})),
    () => response(JSON.stringify({...content, general: 'a'.repeat(701)})),
    () => new Response('a'.repeat(131073)),
  ]) {
    let calls = 0;
    const local = new LocalAIProvider(env, async () => { calls++; return makeResponse(); });
    await assert.rejects(local.generate(daily(), signal()), {code: 'LOCAL_AI_INVALID_OUTPUT'});
    assert.equal(calls, 2);
  }
});

test('unavailable Ollama, missing model and network errors stay distinct and do not retry', async () => {
  const cases: [typeof fetch, string][] = [
    [async () => { throw new Error('private details', {cause: {code: 'ECONNREFUSED'}}); }, 'LOCAL_AI_NOT_RUNNING'],
    [async () => { throw new Error('private DNS details', {cause: {code: 'ENOTFOUND'}}); }, 'LOCAL_AI_CONNECTION_ERROR'],
    [async () => new Response('private model detail', {status: 404}), 'LOCAL_AI_MODEL_NOT_FOUND'],
    [async () => new Response('private detail', {status: 500}), 'SERVER_ERROR'],
    [async () => new Response('timeout', {status: 504}), 'LOCAL_AI_TIMEOUT'],
  ];
  for (const [fetcher, code] of cases) {
    let calls = 0;
    const local = new LocalAIProvider(env, async (...args) => { calls++; return fetcher(...args); });
    await assert.rejects(local.generate(daily(), signal()), {code});
    assert.equal(calls, 1);
  }
});

test('gateway deadline covers inference and repair together; cancellation does not become a timeout', async () => {
  let calls = 0;
  const local = new LocalAIProvider(env, async (_url, init) => {
    if (++calls === 1) return response('bad');
    return new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('abort')), {once: true}));
  });
  await assert.rejects(createGateway({...env, LOCAL_AI_TIMEOUT_MS: 20}, local)({request: daily()}), {code: 'LOCAL_AI_TIMEOUT'});
  assert.equal(calls, 2);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(createGateway(env, local)({request: daily()}, controller.signal), {code: 'REQUEST_CANCELLED'});
});

test('concurrent inference is bounded and gateway recovers after a failed request', async () => {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const gateway = createGateway(env, {async generate() { await held; return content; }});
  const first = gateway({request: daily()});
  await assert.rejects(gateway({request: daily()}), {code: 'RATE_LIMITED'});
  release();
  await first;
  assert.equal((await gateway({request: daily()})).success, true);
});

test('prompts specify Tamil and English explicitly, minimize private data and disallow invented chart calculations', () => {
  assert.match(buildPrompt(daily('ta')).instructions, /தமிழ்/);
  assert.match(buildPrompt(daily('en')).instructions, /English/);
  const prompt = buildPrompt({...daily(), inputs: {birthDate: '2000-01-01'}});
  assert.ok(!prompt.input.includes('2000-01-01'));
  assert.match(prompt.instructions, /deterministic ephemeris/);
});

test('timing logs are payload-free and mobile deadline exceeds backend total deadline', () => {
  const logs: string[] = [];
  const original = console.info;
  console.info = (line: string) => { logs.push(line); };
  try { timedRequest(() => { markTiming('local AI call started'); markTiming('local AI response received'); }); }
  finally { console.info = original; }
  for (const line of logs) assert.deepEqual(Object.keys(JSON.parse(line)), ['stage', 'elapsedMs']);
  const mobile = readFileSync('../src/services/ai/aiClient.ts', 'utf8');
  assert.ok(Number(mobile.match(/options.timeoutMs \?\? (\d+)/)?.[1]) > env.LOCAL_AI_TIMEOUT_MS);
});

test('mobile has no provider state/UI/SDK or model knowledge; exactly one Retry owner', () => {
  function files(dir: string): string[] {
    return readdirSync(dir, {withFileTypes: true}).flatMap(item => item.isDirectory() ? files(join(dir, item.name)) : /\.tsx?$/.test(item.name) ? [join(dir, item.name)] : []);
  }
  for (const file of [...files('../src'), ...files('../app')]) {
    if (file.endsWith('strings.ts') || file.endsWith('zodiac.ts')) continue;
    const text = readFileSync(file, 'utf8');
    assert.ok(!/useAISettings|AISettingsProvider|providerStore|\bLOCAL_AI_MODEL\b|11434|@google\/genai|from ['"]openai['"]/.test(text), file);
  }
  const screen = readFileSync('../src/screens/CreatePosterScreen.tsx', 'utf8');
  assert.equal((screen.match(/t\('ai.retry'\)/g) ?? []).length, 1);
  const deps = JSON.parse(readFileSync('package.json', 'utf8')).dependencies;
  assert.equal(deps.openai, undefined);
  assert.equal(deps['@google/genai'], undefined);
});
