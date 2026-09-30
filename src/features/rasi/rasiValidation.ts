import {ZODIACS} from '../astrology/zodiac';
import type {RasiItem} from './types';

export function validateRasiItems(items: RasiItem[]) {
  const ids = items.map(item => item.zodiacId);
  return items.length === ZODIACS.length &&
    new Set(ids).size === ZODIACS.length &&
    ZODIACS.every((zodiac, index) => ids[index] === zodiac.id);
}
