import React, {createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {translate, type LanguageCode, type TranslationKey} from './index';
import {createLanguageStore} from './languageStore';
import {theme} from '../theme';

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => Promise<void>;
  t: (key: TranslationKey) => string;
  ready: boolean;
  storageError: 'load' | 'save' | null;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({children}: {children: React.ReactNode}) {
  const [store] = useState(() => createLanguageStore(AsyncStorage));
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  useEffect(() => { void store.hydrate(); }, [store]);

  const value = useMemo(() => ({
    ...snapshot,
    setLanguage: store.setLanguage,
    t: (key: TranslationKey) => translate(snapshot.language, key),
  }), [snapshot, store]);

  return (
    <LanguageContext.Provider value={value}>
      {snapshot.ready ? children : (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.gold} accessibilityLabel={value.t('loading')} />
        </View>
      )}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}

const styles = StyleSheet.create({
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg},
});
