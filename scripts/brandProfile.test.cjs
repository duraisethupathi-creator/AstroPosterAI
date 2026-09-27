const assert = require('node:assert/strict');
const fs = require('node:fs');
const {test} = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const {outputText} = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}, fileName: filename,
  });
  module._compile(outputText, filename);
};

const {emptyBrandProfile, normalizeBrandProfile, validateBrandProfile, isBrandProfileComplete, toBrandSnapshot} = require('../src/types/brandProfile.ts');
const {createBrandProfileStorage, BRAND_PROFILE_STORAGE_KEY} = require('../src/services/storage/brandProfileRepository.ts');
const {createBrandProfileStore} = require('../src/state/brandProfileStore.ts');

function memory(initial = null) {
  const values = new Map([['astroposter.language', 'ml']]);
  if (initial !== null) values.set(BRAND_PROFILE_STORAGE_KEY, initial);
  return {
    values,
    async getItem(key) { return values.get(key) ?? null; },
    async setItem(key, value) { values.set(key, value); },
    async removeItem(key) { values.delete(key); },
  };
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
}
function assets(overrides = {}) { return {pick: async () => null, cleanup: () => true, ...overrides}; }
function valid(changes = {}) { return {...emptyBrandProfile(), businessName: 'Astro Studio', phone: '+91 98765 43210', ...changes}; }

test('first launch, missing and malformed data restore safe defaults', async () => {
  for (const raw of [null, '', '{bad', 'null', '[]', '42', '{"version":99}', '{"version":1,"profile":null}']) {
    const repository = createBrandProfileStorage(memory(raw));
    assert.deepEqual(await repository.getBrandProfile(), emptyBrandProfile());
  }
});

test('stored JSON is whitelisted, sanitized and excludes nonlocal images', () => {
  const profile = normalizeBrandProfile({businessName: ' Center ', phone: 12,
    logoUri: 'data:image/png;base64,AAAA', profilePhotoUri: 'https://example.com/photo.jpg',
    createdAt: 'invalid', updatedAt: [], extra: 'discard'});
  assert.equal(profile.businessName, 'Center');
  assert.equal(profile.phone, '');
  assert.equal(profile.logoUri, null);
  assert.equal(profile.profilePhotoUri, null);
  assert.equal(profile.createdAt, null);
  assert.equal(profile.updatedAt, null);
  assert.equal(profile.extra, undefined);
  assert.equal(normalizeBrandProfile({logoUri: 'file:///documents/logo.png'}).logoUri, 'file:///documents/logo.png');
});

test('identity is required; optional fields and international contact formatting are supported', () => {
  assert.equal(validateBrandProfile(emptyBrandProfile()).businessName, 'brandIdentityRequired');
  assert.deepEqual(validateBrandProfile(valid({phone: '', astrologerName: 'Name'})), {});
  assert.deepEqual(validateBrandProfile(valid({businessName: '', astrologerName: 'Name', phone: '(020) 1234-5678', whatsapp: '+1 234 567 8901', email: 'name+brand@example.com', website: 'example.com/path', instagram: '@astro', facebook: 'My page', youtube: 'channel'})), {});
  for (const phone of ['abc', '123', '1'.repeat(16), '12+3456789']) {
    assert.equal(validateBrandProfile(valid({phone})).phone, 'brandPhoneInvalid');
    assert.equal(validateBrandProfile(valid({whatsapp: phone})).whatsapp, 'brandWhatsappInvalid');
  }
  for (const email of ['no-at', 'x@x', 'x y@example.com']) assert.equal(validateBrandProfile(valid({email})).email, 'brandEmailInvalid');
  for (const website of ['bad', 'javascript:alert(1)', 'ftp://example.com', 'https://a..com', 'https://-x.com', 'https://user:pass@example.com', 'https://exa mple.com']) {
    assert.equal(validateBrandProfile(valid({website})).website, 'brandWebsiteInvalid', website);
  }
  for (const website of ['https://example.com', 'http://example.com/path?q=1', 'www.example.com']) assert.deepEqual(validateBrandProfile(valid({website})), {});
  assert.equal(isBrandProfileComplete(valid()), true);
  assert.equal(isBrandProfileComplete(valid({phone: '', whatsapp: ''})), false);
});

test('save/update/clear preserve timestamps, URI references and unrelated storage', async () => {
  const storage = memory();
  let time = '2026-09-27T10:00:00.000Z';
  const repository = createBrandProfileStorage(storage, () => time);
  const saved = await repository.saveBrandProfile(valid({logoUri: 'file:///documents/logo.png'}));
  assert.equal(saved.createdAt, time);
  assert.equal(saved.updatedAt, time);
  time = '2026-09-27T11:00:00.000Z';
  const updated = await repository.updateBrandProfile({tagline: ' New tagline ', whatsapp: '+44 1234567890'});
  assert.equal(updated.createdAt, saved.createdAt);
  assert.equal(updated.updatedAt, time);
  assert.equal(updated.tagline, 'New tagline');
  assert.equal(updated.logoUri, saved.logoUri);
  assert.deepEqual(await createBrandProfileStorage(storage).getBrandProfile(), updated);
  assert.ok(!storage.values.get(BRAND_PROFILE_STORAGE_KEY).includes('base64'));
  await repository.clearBrandProfile();
  assert.deepEqual(await repository.getBrandProfile(), emptyBrandProfile());
  assert.equal(storage.values.get('astroposter.language'), 'ml');
  const recreated = await repository.saveBrandProfile(valid());
  assert.equal(recreated.createdAt, time);
});

test('concurrent partial updates are serialized without dropping changes', async () => {
  const repository = createBrandProfileStorage(memory());
  await repository.saveBrandProfile(valid());
  await Promise.all([repository.updateBrandProfile({qualification: 'Degree'}), repository.updateBrandProfile({tagline: 'Tagline'})]);
  const profile = await repository.getBrandProfile();
  assert.equal(profile.qualification, 'Degree');
  assert.equal(profile.tagline, 'Tagline');
});

test('failed/invalid writes do not poison the repository queue or destroy prior data', async () => {
  const storage = memory();
  const repository = createBrandProfileStorage(storage);
  const saved = await repository.saveBrandProfile(valid());
  await assert.rejects(repository.saveBrandProfile(emptyBrandProfile()));
  assert.deepEqual(await repository.getBrandProfile(), saved);
  const original = storage.setItem;
  storage.setItem = async () => { throw new Error('Disk full'); };
  await assert.rejects(repository.updateBrandProfile({businessName: 'New'}));
  storage.setItem = original;
  assert.deepEqual(await repository.getBrandProfile(), saved);
  await repository.updateBrandProfile({businessName: 'Recovered'});
  assert.equal((await repository.getBrandProfile()).businessName, 'Recovered');
});

test('one root draft updates reactively while snapshots use only saved values', async () => {
  const storage = memory();
  const store = createBrandProfileStore(createBrandProfileStorage(storage), assets());
  store.updateProfile({businessName: 'Too early'});
  assert.equal(store.getSnapshot().profile.businessName, '');
  await store.hydrate();
  let updates = 0;
  const unsubscribe = store.subscribe(() => updates++);
  store.updateProfile({businessName: 'Draft', phone: '+91 9876543210'});
  assert.equal(updates, 1);
  assert.equal(toBrandSnapshot(store.getSnapshot().savedProfile).businessName, '');
  assert.equal(await store.saveProfile(), true);
  const snapshot = toBrandSnapshot(store.getSnapshot().savedProfile);
  assert.equal(snapshot.businessName, 'Draft');
  assert.equal(Object.isFrozen(snapshot), true);
  store.updateProfile({businessName: 'Unsaved'});
  assert.equal(snapshot.businessName, 'Draft');
  assert.equal(toBrandSnapshot(store.getSnapshot().savedProfile).businessName, 'Draft');
  const restarted = createBrandProfileStore(createBrandProfileStorage(storage), assets());
  await restarted.hydrate();
  assert.equal(restarted.getSnapshot().profile.businessName, 'Draft');
  unsubscribe();
});

test('storage failures retain draft and saved data; retry/reset can recover', async () => {
  const storage = memory();
  const repository = createBrandProfileStorage(storage);
  await repository.saveBrandProfile(valid());
  const store = createBrandProfileStore(repository, assets());
  const get = storage.getItem;
  storage.getItem = async () => { throw new Error('Unavailable'); };
  await store.hydrate();
  assert.equal(store.getSnapshot().loadFailed, true);
  assert.equal(await store.saveProfile(), false);
  storage.getItem = get;
  await store.hydrate();
  assert.equal(store.getSnapshot().profile.businessName, 'Astro Studio');
  store.updateProfile({tagline: 'Unsaved'});
  const set = storage.setItem;
  storage.setItem = async () => { throw new Error('Disk full'); };
  assert.equal(await store.saveProfile(), false);
  assert.equal(store.getSnapshot().profile.tagline, 'Unsaved');
  assert.equal(store.getSnapshot().savedProfile.tagline, '');
  storage.setItem = set;
  assert.equal(await store.saveProfile(), true);
  const remove = storage.removeItem;
  storage.removeItem = async () => { throw new Error('Unavailable'); };
  assert.equal(await store.resetProfile(), false);
  assert.equal(store.getSnapshot().savedProfile.tagline, 'Unsaved');
  storage.removeItem = remove;
  assert.equal(await store.resetProfile(), true);
  assert.deepEqual(store.getSnapshot().profile, emptyBrandProfile());
});

test('saving freezes edits and rejects duplicate save/reset until completion', async () => {
  const write = deferred();
  const storage = memory();
  const original = storage.setItem;
  storage.setItem = async (...args) => { await write.promise; await original(...args); };
  const store = createBrandProfileStore(createBrandProfileStorage(storage), assets());
  await store.hydrate();
  store.updateProfile({businessName: 'Name'});
  const save = store.saveProfile();
  store.updateProfile({businessName: 'Racing edit'});
  assert.equal(store.getSnapshot().profile.businessName, 'Name');
  assert.equal(await store.saveProfile(), false);
  assert.equal(await store.resetProfile(), false);
  write.resolve();
  assert.equal(await save, true);
});

test('image cancel/failure, replacement and removal preserve the saved image until save', async () => {
  const repository = createBrandProfileStorage(memory());
  await repository.saveBrandProfile(valid({logoUri: 'file:///old.png'}));
  let result = null;
  const retained = [];
  const store = createBrandProfileStore(repository, assets({
    pick: async () => { if (result instanceof Error) throw result; return result; },
    cleanup: profiles => { retained.push(profiles.flatMap(p => [p.logoUri, p.profilePhotoUri])); return true; },
  }));
  await store.hydrate();
  await store.selectAsset('logoUri');
  assert.equal(store.getSnapshot().profile.logoUri, 'file:///old.png');
  result = new Error('Denied');
  await store.selectAsset('logoUri');
  assert.equal(store.getSnapshot().notice, 'brandImageError');
  assert.equal(store.getSnapshot().profile.logoUri, 'file:///old.png');
  result = 'file:///new.png';
  await store.selectAsset('logoUri');
  assert.equal(store.getSnapshot().profile.logoUri, result);
  assert.equal(store.getSnapshot().savedProfile.logoUri, 'file:///old.png');
  assert.ok(retained.at(-1).includes('file:///old.png'));
  assert.ok(retained.at(-1).includes('file:///new.png'));
  store.removeAsset('logoUri');
  assert.equal(store.getSnapshot().profile.logoUri, null);
  assert.ok(retained.at(-1).includes('file:///old.png'));
  await store.saveProfile();
  assert.equal(store.getSnapshot().savedProfile.logoUri, null);
  assert.ok(!retained.at(-1).includes('file:///old.png'));
});

test('asset cleanup failure does not turn a successful save into data loss', async () => {
  const store = createBrandProfileStore(createBrandProfileStorage(memory()), assets({cleanup: () => false}));
  await store.hydrate();
  store.updateProfile({businessName: 'Name'});
  assert.equal(await store.saveProfile(), true);
  assert.equal(store.getSnapshot().savedProfile.businessName, 'Name');
  assert.equal(store.getSnapshot().notice, 'brandCleanupWarning');
});

test('native picker copies to documents, avoids permissions/base64 and cleans only owned unused files', async () => {
  const Module = require('node:module');
  const originalLoad = Module._load;
  const paths = new Set(['file:///cache/selected.png']);
  let options, copyTarget, failCopy = false, cancel = false;
  let entries = [];
  class Directory {
    constructor(parent, name) { this.uri = `${typeof parent === 'string' ? parent : parent.uri}/${name}`; }
    create() { paths.add(this.uri); }
    get exists() { return paths.has(this.uri); }
    list() { return entries; }
  }
  class File {
    constructor(parent, name) { this.uri = name ? `${parent.uri}/${name}` : parent; }
    get extension() { return '.png'; }
    get name() { return this.uri.split('/').at(-1); }
    get exists() { return paths.has(this.uri); }
    async copy(destination) {
      await Promise.resolve();
      paths.add(destination.uri);
      copyTarget = destination.uri;
      if (failCopy) throw new Error('Copy failed');
    }
    delete() { paths.delete(this.uri); }
  }
  try {
    Module._load = function(request, parent, ...rest) {
      if (request === 'expo-file-system') return {File, Directory, Paths: {document: 'file:///documents'}};
      if (request === 'react-native') return {Platform: {OS: 'android'}};
      if (request === 'expo-image-picker') return {
        async launchImageLibraryAsync(value) {
          options = value;
          return cancel ? {canceled: true, assets: null} : {canceled: false, assets: [{uri: 'file:///cache/selected.png'}]};
        },
      };
      return originalLoad.call(this, request, parent, ...rest);
    };
    const {pickBrandImage, cleanupBrandImages} = require('../src/services/brandAssets.ts');
    cancel = true;
    assert.equal(await pickBrandImage(), null);
    assert.equal(copyTarget, undefined);
    cancel = false;
    const uri = await pickBrandImage();
    assert.ok(uri.startsWith('file:///documents/brand-assets/brand-'));
    assert.ok(paths.has(uri));
    assert.deepEqual(options.mediaTypes, ['images']);
    assert.equal(options.base64, false);
    assert.equal(options.exif, false);
    const orphan = 'file:///documents/brand-assets/brand-orphan.png';
    const other = 'file:///documents/brand-assets/unrelated.txt';
    paths.add(orphan); paths.add(other);
    entries = [new File(uri), new File(orphan), new File(other)];
    assert.equal(cleanupBrandImages([valid({logoUri: uri})]), true);
    assert.ok(paths.has(uri));
    assert.ok(!paths.has(orphan));
    assert.ok(paths.has(other));
    assert.ok(paths.has('file:///cache/selected.png'));
    failCopy = true;
    await assert.rejects(pickBrandImage());
    assert.ok(!paths.has(copyTarget));
  } finally { Module._load = originalLoad; }
});
