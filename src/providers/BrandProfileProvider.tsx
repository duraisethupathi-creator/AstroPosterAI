import React, {createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore} from 'react';
import {brandProfileStorage} from '../services/storage/brandProfileStorage';
import {cleanupBrandImages, pickBrandImage} from '../services/brandAssets';
import {createBrandProfileStore} from '../state/brandProfileStore';
import {isBrandProfileComplete, toBrandSnapshot} from '../types/brandProfile';

function useBrandProfileState() {
  const [store] = useState(() => createBrandProfileStore(brandProfileStorage, {
    pick: pickBrandImage, cleanup: cleanupBrandImages,
  }));
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => { void store.hydrate(); }, [store]);
  return useMemo(() => ({
    ...state,
    updateProfile: store.updateProfile,
    saveProfile: store.saveProfile,
    resetProfile: store.resetProfile,
    reloadProfile: store.hydrate,
    selectAsset: store.selectAsset,
    removeAsset: store.removeAsset,
    hasUnsavedChanges: JSON.stringify(state.profile) !== JSON.stringify(state.savedProfile),
    isProfileComplete: isBrandProfileComplete(state.profile),
    brandSnapshot: toBrandSnapshot(state.savedProfile),
  }), [state, store]);
}

const Context = createContext<ReturnType<typeof useBrandProfileState> | undefined>(undefined);

export function BrandProfileProvider({children}: {children: React.ReactNode}) {
  const value = useBrandProfileState();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useBrandProfile() {
  const value = useContext(Context);
  if (!value) throw new Error('useBrandProfile must be used inside BrandProfileProvider');
  return value;
}

// Poster features consume only saved data, independently of the form component.
export function useBrandSnapshot() { return useBrandProfile().brandSnapshot; }
