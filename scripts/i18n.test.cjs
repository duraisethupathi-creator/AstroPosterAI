const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {test} = require('node:test');
const ts = require('typescript');

// Exercise the actual TypeScript modules with the existing compiler. No test
// framework/native runtime dependencies or generated source files are needed.
require.extensions['.ts'] = (module, filename) => {
  const {outputText} = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const {SUPPORTED_LANGUAGES, translations, translate, isLanguageCode} = require('../src/i18n/index.ts');
const {createLanguageStore, LANGUAGE_STORAGE_KEY} = require('../src/i18n/languageStore.ts');
const {POSTER_CATEGORIES, ZODIACS} = require('../src/config/categories.ts');
const {buildAstrologyRequest} = require('../src/features/astrology/requestBuilder.ts');

function memoryStorage(initial = null) {
  let value = initial;
  return {
    async getItem(key) { assert.equal(key, LANGUAGE_STORAGE_KEY); return value; },
    async setItem(key, next) { assert.equal(key, LANGUAGE_STORAGE_KEY); value = next; },
  };
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
}

test('every translation, category and zodiac is present in all six languages', () => {
  assert.deepEqual(SUPPORTED_LANGUAGES.map(item => item.code), ['ta', 'en', 'hi', 'te', 'kn', 'ml']);
  const keys = Object.keys(translations.en).sort();
  for (const {code, nativeName} of SUPPORTED_LANGUAGES) {
    assert.ok(nativeName.trim());
    assert.deepEqual(Object.keys(translations[code]).sort(), keys);
    for (const key of keys) {
      assert.ok(translations[code][key]?.trim(), `${code}: ${key}`);
      assert.ok(!translations[code][key].includes('\uFFFD'), `${code}: corrupted ${key}`);
    }
    for (const item of POSTER_CATEGORIES) {
      assert.ok(translations[code][item.translationKey]);
      assert.ok(translations[code][item.descriptionKey]);
    }
    for (const item of ZODIACS) assert.ok(translations[code][item.translationKey]);
  }
  assert.equal(POSTER_CATEGORIES.length, 22);
  assert.equal(ZODIACS.length, 12);
  assert.equal(new Set(ZODIACS.map(item => item.id)).size, 12);
  assert.equal(isLanguageCode('fr'), false);
  assert.equal(isLanguageCode(null), false);
  console.log(`Verified ${keys.length} keys × 6 languages, 22 categories and 12 zodiac signs.`);
});

test('a missing or blank translation falls back to English', () => {
  const original = translations.ta.home;
  try {
    delete translations.ta.home;
    assert.equal(translate('ta', 'home'), translations.en.home);
    translations.ta.home = '';
    assert.equal(translate('ta', 'home'), translations.en.home);
  } finally { translations.ta.home = original; }
});

test('all six languages update subscribers immediately and survive a fresh store', async () => {
  const storage = memoryStorage();
  const store = createLanguageStore(storage);
  await store.hydrate();
  const rendered = [];
  const unsubscribe = store.subscribe(() => rendered.push(translate(store.getSnapshot().language, 'home')));
  for (const {code} of SUPPORTED_LANGUAGES) {
    const pending = store.setLanguage(code);
    assert.equal(store.getSnapshot().language, code);
    assert.equal(rendered.at(-1), translations[code].home);
    await pending;
    const restarted = createLanguageStore(storage);
    await restarted.hydrate();
    assert.equal(restarted.getSnapshot().language, code);
    assert.equal(restarted.getSnapshot().ready, true);
  }
  unsubscribe();
});

test('a late restore cannot overwrite a language selected during startup', async () => {
  const read = deferred();
  const store = createLanguageStore({getItem: () => read.promise, setItem: async () => {}});
  const hydration = store.hydrate();
  await store.setLanguage('ml');
  read.resolve('en');
  await hydration;
  assert.equal(store.getSnapshot().language, 'ml');
  assert.equal(store.getSnapshot().ready, true);
});

test('rapid changes are serialized and the final language wins on restart', async () => {
  const first = deferred();
  const started = [];
  let saved = 'ta';
  const storage = {
    async getItem() { return saved; },
    async setItem(key, language) {
      started.push(language);
      if (started.length === 1) await first.promise;
      saved = language;
    },
  };
  const store = createLanguageStore(storage);
  await store.hydrate();
  const writes = ['hi', 'te', 'kn'].map(code => store.setLanguage(code));
  assert.equal(store.getSnapshot().language, 'kn');
  await Promise.resolve();
  assert.deepEqual(started, ['hi']);
  first.resolve();
  await Promise.all(writes);
  assert.deepEqual(started, ['hi', 'te', 'kn']);
  const restarted = createLanguageStore(storage);
  await restarted.hydrate();
  assert.equal(restarted.getSnapshot().language, 'kn');
});

test('invalid saved values use Tamil; hydration is safe to call twice', async () => {
  for (const initial of [null, 'fr', '', 'TA', '{broken']) {
    let reads = 0;
    const store = createLanguageStore({getItem: async () => { reads++; return initial; }, setItem: async () => {}});
    await Promise.all([store.hydrate(), store.hydrate()]);
    assert.equal(reads, 1);
    assert.equal(store.getSnapshot().language, 'ta');
    assert.equal(store.getSnapshot().ready, true);
  }
});

test('read/write failures are handled and selecting again retries persistence', async () => {
  let fail = true;
  const store = createLanguageStore({
    async getItem() { throw new Error('offline storage'); },
    async setItem() { if (fail) throw new Error('full storage'); },
  });
  await store.hydrate();
  assert.equal(store.getSnapshot().ready, true);
  assert.equal(store.getSnapshot().storageError, 'load');
  await store.setLanguage('hi');
  assert.equal(store.getSnapshot().language, 'hi');
  assert.equal(store.getSnapshot().storageError, 'save');
  fail = false;
  await store.setLanguage('hi');
  assert.equal(store.getSnapshot().storageError, null);
});

test('an old failed write cannot set an error on a newer successful selection', async () => {
  const store = createLanguageStore({
    async getItem() { return null; },
    async setItem(key, language) { if (language === 'en') throw new Error('failed'); },
  });
  await store.hydrate();
  await Promise.all([store.setLanguage('en'), store.setLanguage('te')]);
  assert.equal(store.getSnapshot().storageError, null);
  assert.equal(store.getSnapshot().language, 'te');
});

test('future AI requests accept every current language without translating IDs', () => {
  for (const {code} of SUPPORTED_LANGUAGES) {
    const result = buildAstrologyRequest({categoryId: 'daily', language: code, values: {date: '2026-09-27', zodiac: 'aries', extraInstruction: 'user text'}});
    assert.equal(result.ok, true);
    assert.equal(result.request.categoryId, 'daily');
    assert.equal(result.request.zodiacId, 'aries');
    assert.equal(result.request.language, code);
    assert.equal(result.request.extraInstruction, 'user text');
    assert.equal(result.request.provider, undefined);
  }
});

function sourceFiles(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(item => {
    const filename = path.join(dir, item.name);
    return item.isDirectory() ? sourceFiles(filename) : /\.tsx?$/.test(filename) ? [filename] : [];
  });
}

test('application source has no deprecated SafeAreaView, invalid literal keys or untranslated JSX labels', () => {
  const failures = [];
  // Product name and font-preview glyphs are intentionally language invariant.
  const invariantText = new Set(['ASTROPOSTER AI', 'Aa']);
  for (const filename of [...sourceFiles('app'), ...sourceFiles('src')]) {
    const source = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isImportDeclaration(node) && node.moduleSpecifier.text === 'react-native' && /\bSafeAreaView\b/.test(node.getText(source))) failures.push(`${filename}: deprecated SafeAreaView`);
      if (ts.isCallExpression(node) && node.expression.getText(source) === 't' && node.arguments[0] && ts.isStringLiteral(node.arguments[0]) && !Object.hasOwn(translations.en, node.arguments[0].text)) failures.push(`${filename}: invalid translation key`);
      if (ts.isJsxText(node)) {
        const text = node.text.trim();
        if (/\p{L}/u.test(text) && !invariantText.has(text)) failures.push(`${filename}: untranslated text ${text}`);
      }
      if (ts.isJsxAttribute(node) && ['title', 'placeholder', 'accessibilityLabel', 'message'].includes(node.name.getText(source)) && node.initializer && ts.isStringLiteral(node.initializer) && /\p{L}/u.test(node.initializer.text)) failures.push(`${filename}: untranslated ${node.name.getText(source)}`);
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  assert.deepEqual(failures, []);
});
