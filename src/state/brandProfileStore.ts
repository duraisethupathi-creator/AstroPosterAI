import type {TranslationKey} from '../i18n';
import type {BrandProfileStorage} from '../services/storage/brandProfileRepository';
import {emptyBrandProfile, validateBrandProfile, type BrandAssetField, type BrandProfile, type BrandProfileFields, type BrandValidationErrors} from '../types/brandProfile';

type State = {
  profile: BrandProfile;
  savedProfile: BrandProfile;
  loading: boolean;
  loadFailed: boolean;
  busy: 'save' | 'reset' | 'image' | null;
  validationErrors: BrandValidationErrors;
  notice: TranslationKey | null;
};
type Assets = {
  pick(): Promise<string | null>;
  cleanup(profiles: readonly BrandProfile[]): boolean;
};

// One draft and one durable snapshot, owned by the root provider, not screens.
export function createBrandProfileStore(storage: BrandProfileStorage, assets: Assets) {
  let state: State = {
    profile: emptyBrandProfile(), savedProfile: emptyBrandProfile(), loading: true,
    loadFailed: false, busy: null, validationErrors: {}, notice: null,
  };
  let hydration: Promise<void> | undefined;
  const listeners = new Set<() => void>();
  function update(changes: Partial<State>) {
    state = {...state, ...changes};
    listeners.forEach(listener => listener());
  }
  function unavailable() { return state.loading || state.loadFailed || state.busy !== null; }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    hydrate() {
      if (hydration && !state.loadFailed) return hydration;
      update({loading: true, loadFailed: false, notice: null});
      hydration = (async () => {
        try {
          const profile = await storage.getBrandProfile();
          // Loading safe defaults must not delete files if stored JSON is damaged.
          update({profile, savedProfile: profile, loading: false, notice: null});
        } catch {
          update({loading: false, loadFailed: true, notice: 'brandLoadError'});
        }
      })();
      return hydration;
    },
    updateProfile(changes: Partial<BrandProfileFields>) {
      if (unavailable()) return;
      update({profile: {...state.profile, ...changes}, validationErrors: {}, notice: null});
    },
    async saveProfile(): Promise<boolean> {
      if (unavailable()) return false;
      const validationErrors = validateBrandProfile(state.profile);
      if (Object.keys(validationErrors).length) {
        update({validationErrors, notice: 'brandValidationSummary'});
        return false;
      }
      update({busy: 'save', notice: null, validationErrors: {}});
      try {
        const profile = await storage.saveBrandProfile(state.profile);
        const cleaned = assets.cleanup([profile]);
        update({profile, savedProfile: profile, busy: null, notice: cleaned ? 'brandSaved' : 'brandCleanupWarning'});
        return true;
      } catch {
        update({busy: null, notice: 'brandSaveError'});
        return false;
      }
    },
    async resetProfile(): Promise<boolean> {
      if (state.loading || state.busy) return false;
      update({busy: 'reset', notice: null});
      try {
        await storage.clearBrandProfile();
        const cleaned = assets.cleanup([]);
        update({profile: emptyBrandProfile(), savedProfile: emptyBrandProfile(), validationErrors: {},
          loadFailed: false, busy: null, notice: cleaned ? 'brandResetSuccess' : 'brandCleanupWarning'});
        return true;
      } catch {
        update({busy: null, notice: 'brandResetError'});
        return false;
      }
    },
    async selectAsset(field: BrandAssetField): Promise<void> {
      if (unavailable()) return;
      update({busy: 'image', notice: null});
      try {
        const uri = await assets.pick();
        if (uri) {
          const profile = {...state.profile, [field]: uri};
          const cleaned = assets.cleanup([state.savedProfile, profile]);
          update({profile, notice: cleaned ? null : 'brandCleanupWarning'});
        }
        update({busy: null});
      } catch { update({busy: null, notice: 'brandImageError'}); }
    },
    removeAsset(field: BrandAssetField) {
      if (unavailable()) return;
      const profile = {...state.profile, [field]: null};
      const cleaned = assets.cleanup([state.savedProfile, profile]);
      update({profile, notice: cleaned ? null : 'brandCleanupWarning'});
    },
  };
}
