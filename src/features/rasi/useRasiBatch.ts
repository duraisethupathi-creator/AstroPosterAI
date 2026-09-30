import {useSyncExternalStore} from 'react';
import {rasiStore} from './rasiStore';
export function useRasiBatch() {
  return useSyncExternalStore(rasiStore.subscribe, rasiStore.getSnapshot, rasiStore.getSnapshot);
}
