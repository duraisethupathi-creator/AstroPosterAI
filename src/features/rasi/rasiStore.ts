import {generateLocalRasiContent} from './localRasiGenerator';
import {ZODIACS, type ZodiacId} from '../astrology/zodiac';
import type {AstrologyGenerationRequest} from '../astrology/types';
import type {RasiBatch, RasiItem} from './types';
import {validateRasiItems} from './rasiValidation';

type Listener = () => void;
let state: RasiBatch | undefined;
let runId = 0;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach(listener => listener());
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function requestFor(base: AstrologyGenerationRequest, zodiacId: ZodiacId): AstrologyGenerationRequest {
  return {...copy(base), zodiacId, generateAllZodiacs: false};
}
function replaceItem(zodiacId: ZodiacId, patch: Partial<RasiItem>) {
  if (!state) return;
  state = {...state, items: state.items.map(item => item.zodiacId === zodiacId ? {...item, ...patch} : item)};
  emit();
}
async function runQueue(ids: ZodiacId[], concurrency = 3) {
  if (!state) return;
  const myRun = ++runId;
  state = {...state, running: true, cancelled: false}; emit();
  let cursor = 0;
  async function worker() {
    while (cursor < ids.length && state && myRun === runId && !state.cancelled) {
      const zodiacId = ids[cursor++];
      const item = state.items.find(entry => entry.zodiacId === zodiacId);
      if (!item) continue;
      replaceItem(zodiacId, {status: 'generating', error: undefined});
      try {
        const result = await generateLocalRasiContent(item.request);
        if (!state || myRun !== runId || state.cancelled) return;
        if (result.zodiacId !== zodiacId) throw new Error('ZODIAC_MISMATCH');
        replaceItem(zodiacId, {status: 'success', result});
      } catch (error) {
        if (!state || myRun !== runId || state.cancelled) return;
        replaceItem(zodiacId, {status: 'failed', error: error instanceof Error ? error.message : 'GENERATION_FAILED'});
      }
    }
  }
  await Promise.all(Array.from({length: Math.min(concurrency, ids.length)}, worker));
  if (state && myRun === runId) { state = {...state, running: false}; emit(); }
}

export const rasiStore = {
  subscribe(listener: Listener) { listeners.add(listener); return () => listeners.delete(listener); },
  getSnapshot() { return state; },
  prepare(baseRequest: AstrologyGenerationRequest) {
    if (!baseRequest.generateAllZodiacs) throw new Error('Bulk request required');
    const items = ZODIACS.map(zodiac => ({
      zodiacId: zodiac.id, status: 'pending' as const, request: requestFor(baseRequest, zodiac.id),
    }));
    if (!validateRasiItems(items)) throw new Error('Invalid zodiac batch');
    state = {id: Date.now().toString(36), baseRequest: copy(baseRequest), items, running: false, cancelled: false};
    emit();
  },
  generateAll() {
    if (!state || state.running) return Promise.resolve();
    return runQueue(state.items.filter(item => item.status !== 'success').map(item => item.zodiacId));
  },
  retryFailed() {
    if (!state || state.running) return Promise.resolve();
    return runQueue(state.items.filter(item => item.status === 'failed').map(item => item.zodiacId));
  },
  retryOne(zodiacId: ZodiacId) {
    if (!state || state.running) return Promise.resolve();
    return runQueue([zodiacId], 1);
  },
  cancel() {
    if (!state) return;
    runId++;
    state = {...state, running: false, cancelled: true,
      items: state.items.map(item => item.status === 'generating' ? {...item, status: 'pending'} : item)};
    emit();
  },
};
