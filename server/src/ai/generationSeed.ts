import {createHash} from 'node:crypto';
import type {AstrologyGenerationRequest} from '../../../src/features/astrology/types';
import type {ContentAction} from '../../../src/types/contentStudio';

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}
// Stable for identical context; changing zodiac/language/operation changes the seed.
export function generationSeed(request: AstrologyGenerationRequest, action?: ContentAction): number {
  return createHash('sha256').update(JSON.stringify(canonical({request, action}))).digest().readUInt32LE(0) & 0x7fffffff;
}
