import {AsyncLocalStorage} from 'node:async_hooks';

const clock = new AsyncLocalStorage<number>();
export type TimingStage = 'request received' | 'local AI call started' | 'local AI response received' | 'local AI repair started' |
  'schema validation completed' | 'response returned';
export function timedRequest<T>(action: () => T): T {
  return clock.run(performance.now(), action);
}
export function markTiming(stage: TimingStage) {
  const start = clock.getStore();
  if (start !== undefined) console.info(JSON.stringify({stage, elapsedMs: Math.round(performance.now() - start)}));
}
