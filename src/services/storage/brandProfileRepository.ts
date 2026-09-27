import {emptyBrandProfile, normalizeBrandProfile, validateBrandProfile, type BrandProfile, type BrandProfileFields} from '../../types/brandProfile';

export const BRAND_PROFILE_STORAGE_KEY = 'astroposter.brandProfile.v1';
type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
  removeItem(key: string): Promise<unknown>;
};

export function createBrandProfileStorage(storage: Storage, now = () => new Date().toISOString()) {
  let queue: Promise<unknown> = Promise.resolve();
  function serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.then(operation);
    queue = result.catch(() => undefined);
    return result;
  }

  async function read(): Promise<BrandProfile> {
    const raw = await storage.getItem(BRAND_PROFILE_STORAGE_KEY);
    if (!raw) return emptyBrandProfile();
    try {
      const envelope = JSON.parse(raw);
      return envelope?.version === 1 ? normalizeBrandProfile(envelope.profile) : emptyBrandProfile();
    } catch { return emptyBrandProfile(); }
  }

  async function write(fields: BrandProfileFields, previous: BrandProfile): Promise<BrandProfile> {
    const profile = normalizeBrandProfile(fields);
    if (Object.keys(validateBrandProfile(profile)).length) throw new Error('Invalid brand profile');
    const savedAt = now();
    profile.createdAt = previous.createdAt ?? savedAt;
    profile.updatedAt = savedAt;
    await storage.setItem(BRAND_PROFILE_STORAGE_KEY, JSON.stringify({version: 1, profile}));
    return profile;
  }

  return {
    getBrandProfile: () => serialize(read),
    saveBrandProfile: (profile: BrandProfileFields) => serialize(async () => write(profile, await read())),
    updateBrandProfile: (changes: Partial<BrandProfileFields>) => serialize(async () => {
      const previous = await read();
      return write({...previous, ...changes}, previous);
    }),
    clearBrandProfile: () => serialize(async () => { await storage.removeItem(BRAND_PROFILE_STORAGE_KEY); }),
  };
}

export type BrandProfileStorage = ReturnType<typeof createBrandProfileStorage>;
