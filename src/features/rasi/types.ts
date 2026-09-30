import type {AstrologyGenerationRequest} from '../astrology/types';
import type {ZodiacId} from '../astrology/zodiac';
import type {AstrologyGenerationResult} from '../../types/generation';

export type RasiStatus = 'pending' | 'generating' | 'success' | 'failed';
export type RasiItem = {
  zodiacId: ZodiacId;
  status: RasiStatus;
  request: AstrologyGenerationRequest;
  result?: AstrologyGenerationResult;
  error?: string;
};
export type RasiBatch = {
  id: string;
  baseRequest: AstrologyGenerationRequest;
  items: RasiItem[];
  running: boolean;
  cancelled: boolean;
};
