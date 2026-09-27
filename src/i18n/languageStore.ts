import {isLanguageCode, type LanguageCode} from './index';

export const LANGUAGE_STORAGE_KEY = 'astroposter.language';

type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
};

type LanguageSnapshot = {
  language: LanguageCode;
  ready: boolean;
  storageError: 'load' | 'save' | null;
};

// Owned by LanguageProvider. Storage is injected so restoration and write races
// can be verified without a device or an additional state-management library.
export function createLanguageStore(storage: Storage) {
  let snapshot: LanguageSnapshot = {language: 'ta', ready: false, storageError: null};
  let revision = 0;
  let hydration: Promise<void> | undefined;
  let writes = Promise.resolve();
  const listeners = new Set<() => void>();

  function update(change: Partial<LanguageSnapshot>) {
    snapshot = {...snapshot, ...change};
    listeners.forEach(listener => listener());
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    hydrate() {
      if (!hydration) {
        const startedAt = revision;
        hydration = (async () => {
          try {
            const saved = await storage.getItem(LANGUAGE_STORAGE_KEY);
            // A late disk read must never replace a newer user selection.
            if (revision === startedAt && isLanguageCode(saved)) update({language: saved});
          } catch {
            if (revision === startedAt) update({storageError: 'load'});
          } finally {
            update({ready: true});
          }
        })();
      }
      return hydration;
    },
    setLanguage(language: LanguageCode) {
      const selectedAt = ++revision;
      update({language, storageError: null});
      // Serialize writes so rapid taps persist the final selection in order.
      writes = writes.then(async () => {
        try {
          await storage.setItem(LANGUAGE_STORAGE_KEY, language);
        } catch {
          if (revision === selectedAt) update({storageError: 'save'});
        }
      });
      return writes;
    },
  };
}
