import assert from 'node:assert/strict';
import {test} from 'node:test';
import {once} from 'node:events';
import {createApp} from '../src/app';
import {createGateway} from '../src/ai/gateway';
import {readEnv} from '../src/config/env';
import {parseGenerationBody} from '../src/validation/generationRequest';
import {outputSchema} from '../src/ai/outputSchemas';
import {buildPrompt} from '../src/ai/promptBuilder';
import {ASTROLOGY_CATEGORIES, getCategory} from '../../src/features/astrology/categories';
import {createCategoryForm} from '../../src/features/astrology/formState';
import {buildAstrologyRequest} from '../../src/features/astrology/requestBuilder';
import {SUPPORTED_LANGUAGES} from '../../src/i18n';
import {generateAstrologyContent} from '../../src/services/ai/aiClient';

const env = readEnv({AI_MOCK_MODE: 'true', NODE_ENV: 'test', RATE_LIMIT_MAX: '100'});
const daily = {request: {categoryId: 'daily', language: 'en', zodiacId: 'aries',
  generateAllZodiacs: false, period: {date: '2026-09-28'}, inputs: {}}};

test('mobile client exposes sanitized configuration, network, backend and response errors for Retry', async () => {
  const {request} = parseGenerationBody(daily);
  const options = {baseUrl: 'http://192.168.1.2:3001', development: true};
  await assert.rejects(generateAstrologyContent(request, {baseUrl: ''}), {code: 'NOT_CONFIGURED'});
  await assert.rejects(generateAstrologyContent(request, {...options,
    fetcher: async () => { throw new Error('private network details'); }}), {code: 'NETWORK_ERROR'});
  await assert.rejects(generateAstrologyContent(request, {...options,
    fetcher: async () => new Response(JSON.stringify({success: false, error: {code: 'RATE_LIMITED', message: 'private details'}}), {status: 429})}), {code: 'RATE_LIMITED'});
  await assert.rejects(generateAstrologyContent(request, {...options,
    fetcher: async () => new Response(JSON.stringify({success: true, content: {}}))}), {code: 'INVALID_RESPONSE'});
});

test('mock and live local modes need no keys; invalid flags fail safely', () => {
  assert.equal(env.AI_MOCK_MODE, true);
  assert.throws(() => readEnv({AI_MOCK_MODE: 'yes'}));
  assert.equal(readEnv({AI_MOCK_MODE: 'false'}).LOCAL_AI_MODEL, 'qwen3.5:2b-q4_K_M');
});

test('all categories and six languages produce schema-valid mock results without calling adapters', async () => {
  const local = {generate: async () => { throw new Error('The local adapter must not run in mock mode'); }};
  const gateway = createGateway(env, local);
  for (const category of ASTROLOGY_CATEGORIES) {
    for (const {code} of SUPPORTED_LANGUAGES) {
      const form = createCategoryForm(category.id);
      for (const field of getCategory(category.id).fields) {
        if (field.type === 'zodiac') form.values[field.id] = 'aries';
        else if (field.type === 'select') form.values[field.id] = field.options[0].value;
        else if (field.required && (field.type === 'text' || field.type === 'multiline')) form.values[field.id] = 'Sample';
      }
      const built = buildAstrologyRequest({...form, language: code});
      assert.ok(built.ok);
      const body = parseGenerationBody({request: built.request});
      const result = await gateway(body);
      assert.equal(result.mode, 'mock');
      assert.equal(result.language, code);
      assert.ok(outputSchema(category.id).safeParse(result.content).success);
    }
  }
});

test('request validation rejects category, language, sign, stale fields, wrong dates and bulk before generation', () => {
  for (const change of [{categoryId: 'invalid'}, {language: 'fr'}, {zodiacId: 'bad'},
    {period: {date: '2026-02-30'}}, {inputs: {service: 'stale'}}, {generateAllZodiacs: true},
    {outputSections: ['secret']}, {promptType: 'override'}]) {
    assert.throws(() => parseGenerationBody({...daily, request: {...daily.request, ...change}}));
  }
  assert.throws(() => parseGenerationBody({...daily, provider: 'bad'}));
});

test('prompt contains selected language and category rules; schema is category-specific', () => {
  const {request} = parseGenerationBody(daily);
  const prompt = buildPrompt(request);
  assert.equal(JSON.parse(prompt.input).language, 'en');
  assert.match(prompt.instructions, /scientific certainty/);
  assert.equal(outputSchema('daily').safeParse({headline: 'wrong'}).success, false);
  assert.equal(outputSchema('service-advertisement').safeParse({headline: 'Hi', description: 'Text', cta: 'Contact'}).success, true);
});

test('HTTP health, mobile client, mock provider selection, CORS and malformed/oversize bodies', async () => {
  const server = createApp(env, createGateway(env)).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), {status: 'ok', service: 'astroposter-ai'});
    const {request} = parseGenerationBody(daily);
    {
      const result = await generateAstrologyContent(request, {baseUrl, development: true});
      assert.equal(result.mode, 'mock');
      assert.equal('provider' in result, false);
      assert.ok(outputSchema('daily').safeParse(result.content).success);
    }
    const bad = await fetch(`${baseUrl}/api/ai/generate`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{broken'});
    assert.equal(bad.status, 400);
    const large = await fetch(`${baseUrl}/api/ai/generate`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({text: 'a'.repeat(25000)})});
    assert.equal(large.status, 413);
    const denied = await fetch(`${baseUrl}/health`, {headers: {Origin: 'https://untrusted.example'}});
    assert.equal(denied.status, 403);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('HTTP rate limiter rejects requests without invoking generation again', async () => {
  const limited = {...env, RATE_LIMIT_MAX: 1};
  const server = createApp(limited, createGateway(limited)).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  try {
    const url = `http://127.0.0.1:${address.port}/api/ai/generate`;
    const options = {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(daily)};
    assert.equal((await fetch(url, options)).status, 200);
    const rejected = await fetch(url, options);
    assert.equal(rejected.status, 429);
    assert.deepEqual(await rejected.json(), {success: false, error: {code: 'RATE_LIMITED'}});
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
