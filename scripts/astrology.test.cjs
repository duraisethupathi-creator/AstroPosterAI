const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {test} = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const {outputText} = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}, fileName: filename,
  });
  module._compile(outputText, filename);
};

const {ASTROLOGY_CATEGORIES, getCategory} = require('../src/features/astrology/categories.ts');
const {FIELDS} = require('../src/features/astrology/categoryFields.ts');
const {ZODIACS} = require('../src/features/astrology/zodiac.ts');
const {createCategoryForm, categoryFormReducer} = require('../src/features/astrology/formState.ts');
const {buildAstrologyRequest} = require('../src/features/astrology/requestBuilder.ts');
const {validateCategory, isValidDate, localDate} = require('../src/features/astrology/validation.ts');
const {SUPPORTED_LANGUAGES, translations} = require('../src/i18n/index.ts');
const {emptyBrandProfile, toBrandSnapshot} = require('../src/types/brandProfile.ts');
const {createBrandProfileStorage} = require('../src/services/storage/brandProfileRepository.ts');
const {createBrandProfileStore} = require('../src/state/brandProfileStore.ts');

const now = new Date(2026, 8, 27, 12);
const expectedIds = ['daily', 'weekly', 'monthly', 'yearly', 'nakshatra', 'sani-peyarchi', 'guru-peyarchi', 'rahu-ketu', 'graha-peyarchi', 'marriage', 'career', 'business', 'finance', 'love', 'health', 'pariharam', 'tips', 'murugan', 'birthday', 'festival', 'service-advertisement', 'custom'];
const bulkIds = ['daily', 'weekly', 'monthly', 'yearly', 'sani-peyarchi', 'guru-peyarchi', 'rahu-ketu'];

function validValues(id) {
  const values = createCategoryForm(id, now).values;
  for (const field of getCategory(id).fields) {
    if (field.type === 'zodiac' && field.required) values[field.id] = 'aries';
    if (field.required && (field.type === 'text' || field.type === 'multiline')) values[field.id] = 'User text';
    if (field.required && field.type === 'select' && !values[field.id]) values[field.id] = field.options[0].value;
  }
  return values;
}

test('all 22 categories and 12 signs have one stable canonical source', () => {
  assert.deepEqual(ASTROLOGY_CATEGORIES.map(item => item.id), expectedIds);
  assert.equal(new Set(expectedIds).size, 22);
  assert.deepEqual(ZODIACS.map(item => item.id), ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']);
  const compatibility = require('../src/config/categories.ts');
  assert.equal(compatibility.POSTER_CATEGORIES, ASTROLOGY_CATEGORIES);
  assert.equal(compatibility.ZODIACS, ZODIACS);
  for (const category of ASTROLOGY_CATEGORIES) {
    assert.equal(new Set(category.fields.map(field => field.id)).size, category.fields.length);
    assert.equal(new Set(category.outputSections).size, category.outputSections.length);
    assert.ok(category.outputSections.length > 0);
    const zodiac = category.fields.find(field => field.type === 'zodiac');
    assert.equal(Boolean(zodiac?.required), category.requiresZodiac);
    if (category.supportsAllZodiacs) assert.ok(zodiac);
    if (category.dateMode !== 'none') assert.ok(category.fields.some(field => field.periodKey === category.dateMode));
  }
});

test('all registry, field, placeholder, option and output labels exist in six languages', () => {
  for (const {code} of SUPPORTED_LANGUAGES) {
    const dictionary = translations[code];
    for (const category of ASTROLOGY_CATEGORIES) {
      assert.ok(dictionary[category.translationKey]);
      assert.ok(dictionary[category.descriptionKey]);
      for (const section of category.outputSections) assert.ok(dictionary[`output.${section}`]);
    }
    for (const field of [...Object.values(FIELDS), ...ASTROLOGY_CATEGORIES.flatMap(category => category.fields)]) {
      assert.ok(dictionary[field.labelKey], `${code}: ${field.labelKey}`);
      if (field.placeholderKey) assert.ok(dictionary[field.placeholderKey]);
      for (const option of field.options ?? []) assert.ok(dictionary[option.translationKey]);
    }
  }
});

test('every category builds a valid provider-independent request in every language', () => {
  for (const category of ASTROLOGY_CATEGORIES) {
    for (const {code} of SUPPORTED_LANGUAGES) {
      const result = buildAstrologyRequest({categoryId: category.id, language: code, values: validValues(category.id)});
      assert.equal(result.ok, true, `${category.id}: ${JSON.stringify(result)}`);
      assert.equal(result.request.categoryId, category.id);
      assert.equal(result.request.language, code);
      assert.equal(result.request.promptType, category.promptType);
      assert.deepEqual(result.request.outputSections, category.outputSections);
      assert.equal(result.request.provider, undefined);
      assert.equal(result.request.generateAllZodiacs, false);
      assert.equal(result.request.inputs.includeBrand, undefined);
    }
  }
});

test('each required field is validated independently; optional zodiac never blocks a request', () => {
  for (const category of ASTROLOGY_CATEGORIES) {
    for (const field of category.fields.filter(field => field.required)) {
      const values = {...validValues(category.id), [field.id]: '   '};
      assert.equal(validateCategory(category, values, false, now)[field.id], 'astro.required', `${category.id}: ${field.id}`);
    }
    const zodiac = category.fields.find(field => field.type === 'zodiac');
    if (zodiac && !zodiac.required) {
      assert.equal(buildAstrologyRequest({categoryId: category.id, language: 'ta', values: {...validValues(category.id), zodiac: ''}}).ok, true);
    }
  }
});

test('date and year validation rejects impossible dates, bad formats and future births', () => {
  for (const value of ['2024-02-29', '2000-02-29', '2026-09-27']) assert.equal(isValidDate(value), true);
  for (const value of ['1900-02-29', '2025-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-01-00', '2026-9-1', '27/09/2026', '2101-01-01']) assert.equal(isValidDate(value), false, value);
  assert.equal(localDate(now), '2026-09-27');
  for (const year of ['', '1899', '2101', '20e3', '2026.5', true]) {
    assert.ok(validateCategory(getCategory('yearly'), {...validValues('yearly'), year}, false, now).year);
  }
  assert.equal(validateCategory(getCategory('birthday'), {...validValues('birthday'), birthDate: '2027-01-01'}, false, now).birthDate, 'astro.futureBirthDate');
  assert.equal(buildAstrologyRequest({categoryId: 'birthday', language: 'en', values: validValues('birthday')}).request.inputs.birthDate, undefined);
});

test('periods serialize consistently, including month/year as numbers and week start as a date', () => {
  const periodCases = [
    ['daily', {date: '2026-09-27'}], ['weekly', {week: '2026-09-27'}],
    ['monthly', {month: 9, year: 2026}], ['yearly', {year: 2026}],
    ['sani-peyarchi', {date: '2026-09-27'}],
  ];
  for (const [categoryId, period] of periodCases) {
    const result = buildAstrologyRequest({categoryId, language: 'en', values: validValues(categoryId)});
    assert.deepEqual(result.request.period, period);
    assert.deepEqual(result.request.inputs, {});
  }
  assert.equal(buildAstrologyRequest({categoryId: 'marriage', language: 'en', values: validValues('marriage')}).request.period, undefined);
});

test('only seven categories allow all-12 mode; requests never contain both bulk and a single sign', () => {
  assert.deepEqual(ASTROLOGY_CATEGORIES.filter(item => item.supportsAllZodiacs).map(item => item.id), bulkIds);
  for (const category of ASTROLOGY_CATEGORIES) {
    const result = buildAstrologyRequest({categoryId: category.id, language: 'en', values: {...validValues(category.id), zodiac: ''}, generateAllZodiacs: true});
    if (bulkIds.includes(category.id)) {
      assert.equal(result.ok, true);
      assert.equal(result.request.zodiacId, undefined);
      const withStaleSign = buildAstrologyRequest({categoryId: category.id, language: 'en', values: {...validValues(category.id), zodiac: 'aries'}, generateAllZodiacs: true});
      assert.equal(withStaleSign.request.zodiacId, undefined);
    } else {
      assert.equal(result.ok, false);
      assert.equal(result.errors.generateAllZodiacs, 'astro.bulkInvalid');
    }
  }
});

test('switching category resets old inputs, preview mode values and bulk mode', () => {
  let state = createCategoryForm('daily', now);
  state = categoryFormReducer(state, {type: 'field', id: 'extraInstruction', value: 'Old instruction'});
  state = categoryFormReducer(state, {type: 'allZodiacs', value: true});
  state = categoryFormReducer(state, {type: 'category', categoryId: 'festival', now});
  assert.equal(state.generateAllZodiacs, false);
  assert.equal(state.values.zodiac, undefined);
  assert.equal(state.values.extraInstruction, '');
  assert.equal(state.values.messageStyle, 'traditional');
  assert.equal(categoryFormReducer(state, {type: 'field', id: 'planet', value: 'sun'}), state);
  assert.equal(categoryFormReducer(state, {type: 'allZodiacs', value: true}), state);
});

test('builder drops obsolete fields even if a stale caller bypasses the form reducer', () => {
  const result = buildAstrologyRequest({categoryId: 'service-advertisement', language: 'hi', values: {
    ...validValues('service-advertisement'), zodiac: 'pisces', date: '2026-01-01', year: '2026',
    nakshatra: 'old', title: 'old', contentBrief: 'old', planet: 'sun', extraInstruction: '  Keep this  ',
  }});
  assert.equal(result.ok, true);
  assert.equal(result.request.zodiacId, undefined);
  assert.equal(result.request.period, undefined);
  assert.deepEqual(result.request.inputs, {service: 'User text', cta: 'User text'});
  assert.equal(result.request.extraInstruction, 'Keep this');
});

test('invalid category, language, options and wrong field types cannot build a request', () => {
  assert.equal(buildAstrologyRequest({categoryId: 'unknown', language: 'en', values: {}}).ok, false);
  assert.equal(buildAstrologyRequest({categoryId: 'daily', language: 'fr', values: validValues('daily')}).ok, false);
  for (const value of ['13', 13, 'September', true]) assert.equal(buildAstrologyRequest({categoryId: 'monthly', language: 'en', values: {...validValues('monthly'), month: value}}).ok, false);
  assert.equal(buildAstrologyRequest({categoryId: 'daily', language: 'en', values: {...validValues('daily'), zodiac: 'Aries'}}).ok, false);
  assert.equal(buildAstrologyRequest({categoryId: 'custom', language: 'en', values: {...validValues('custom'), title: true}}).ok, false);
  assert.equal(buildAstrologyRequest({categoryId: 'custom', language: 'en', values: {...validValues('custom'), contentBrief: 'a'.repeat(2001)}}).ok, false);
  assert.equal(buildAstrologyRequest({categoryId: 'daily', language: 'en', values: {...validValues('daily'), includeBrand: 'true'}}).ok, false);
});

test('request attaches only the current saved brand, can omit it and survives later profile edits', async () => {
  let raw = null;
  const storage = createBrandProfileStorage({getItem: async () => raw, setItem: async (key, value) => { raw = value; }, removeItem: async () => { raw = null; }});
  const store = createBrandProfileStore(storage, {pick: async () => null, cleanup: () => true});
  await store.hydrate();
  store.updateProfile({businessName: 'Saved Brand', phone: '+91 9876543210'});
  await store.saveProfile();
  store.updateProfile({businessName: 'Unsaved Brand'});
  const brand = toBrandSnapshot(store.getSnapshot().savedProfile);
  const result = buildAstrologyRequest({categoryId: 'custom', language: 'ml', values: validValues('custom'), brand});
  assert.equal(result.request.brand.businessName, 'Saved Brand');
  assert.notEqual(result.request.brand, brand);
  assert.equal(result.request.brand.createdAt, undefined);
  assert.equal(result.request.brand.email, undefined);
  assert.equal(buildAstrologyRequest({categoryId: 'custom', language: 'ml', values: {...validValues('custom'), includeBrand: false}, brand}).request.brand, undefined);
  assert.equal(buildAstrologyRequest({categoryId: 'custom', language: 'ml', values: validValues('custom'), brand: toBrandSnapshot(emptyBrandProfile())}).request.brand, undefined);
  await store.resetProfile();
  assert.equal(result.request.brand.businessName, 'Saved Brand');
});

test('output contracts differ by category and do not force horoscope fields onto advertisements', () => {
  assert.deepEqual(getCategory('daily').outputSections, ['general', 'career', 'finance', 'love', 'health', 'luckyNumber', 'luckyColour', 'positiveMessage']);
  assert.deepEqual(getCategory('festival').outputSections, ['title', 'greeting', 'message', 'cta']);
  assert.deepEqual(getCategory('service-advertisement').outputSections, ['headline', 'description', 'cta']);
  assert.deepEqual(getCategory('custom').outputSections, ['title', 'message']);
});

test('feature engine has no provider calls, network clients, storage writes or Brand screen imports', () => {
  function files(dir) {
    return fs.readdirSync(dir, {withFileTypes: true}).flatMap(item => item.isDirectory() ? files(path.join(dir, item.name)) : [path.join(dir, item.name)]);
  }
  for (const filename of files('src/features/astrology')) {
    const source = fs.readFileSync(filename, 'utf8');
    const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isImportDeclaration(node)) {
        assert.ok(!/openai|generative-ai|@google\/genai|axios|async-storage|BrandProfileScreen/i.test(node.moduleSpecifier.text), filename);
      }
      if (ts.isCallExpression(node)) {
        assert.ok(!/^(fetch|axios|XMLHttpRequest)$/.test(node.expression.getText(ast)), filename);
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
});
