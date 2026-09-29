import React, {createContext, useContext, useState, useSyncExternalStore, type PropsWithChildren} from 'react';
import {createContentStudioStore} from '../state/contentStudioStore';
import {contentDraftStorage} from '../services/storage/contentDraftStorage';
import {generateAstrologyContent} from '../services/ai/aiClient';
const Context = createContext<ReturnType<typeof createContentStudioStore> | null>(null);
export function ContentStudioProvider({children}: PropsWithChildren) {
  const [store] = useState(() => createContentStudioStore(contentDraftStorage, generateAstrologyContent));
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useContentStudio() {
  const store = useContext(Context);
  if (!store) throw new Error('ContentStudioProvider missing');
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return {store, state};
}
