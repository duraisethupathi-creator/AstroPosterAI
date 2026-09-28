import type {AstrologyGenerationRequest} from '../../../src/features/astrology/types';
import type {AstrologyGenerationResult} from '../../../src/types/generation';
import type {Env} from '../config/env';
import {ApiError} from '../middleware/errorHandler';
import type {AstrologyAIProvider} from './types';
import {MockProvider} from './mockProvider';
import {validateOutput} from './outputSchemas';
import {markTiming} from './timing';
import {LocalAIProvider} from './localProvider';

export function createGateway(env: Env, localProvider?: AstrologyAIProvider) {
  const adapter = env.AI_MOCK_MODE ? new MockProvider() : localProvider ?? new LocalAIProvider(env);
  // One active inference on modest hardware; do not build an unbounded queue.
  let busy = false;
  return async function generateAstrologyContent({request}: {
    request: AstrologyGenerationRequest;
  }, callerSignal?: AbortSignal): Promise<AstrologyGenerationResult> {
    if (request.generateAllZodiacs) throw new ApiError(422, 'BULK_NOT_SUPPORTED');
    if (busy) throw new ApiError(429, 'RATE_LIMITED');
    busy = true;
    const controller = new AbortController();
    let deadlineExpired = false;
    const cancel = () => controller.abort();
    if (callerSignal?.aborted) cancel();
    callerSignal?.addEventListener('abort', cancel, {once: true});
    let timer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: (() => void) | undefined;
    try {
      if (controller.signal.aborted) throw new ApiError(499, 'REQUEST_CANCELLED');
      const deadline = new Promise<never>((_, reject) => {
        onAbort = () => reject(deadlineExpired ? new ApiError(504, 'LOCAL_AI_TIMEOUT') : new ApiError(499, 'REQUEST_CANCELLED'));
        controller.signal.addEventListener('abort', onAbort, {once: true});
        timer = setTimeout(() => { deadlineExpired = true; cancel(); }, env.LOCAL_AI_TIMEOUT_MS);
        if (controller.signal.aborted) onAbort();
      });
      const raw = await Promise.race([adapter.generate(request, controller.signal), deadline]);
      const content = validateOutput(request.categoryId, raw);
      markTiming('schema validation completed');
      return {success: true, mode: env.AI_MOCK_MODE ? 'mock' : 'live',
        categoryId: request.categoryId, language: request.language, zodiacId: request.zodiacId, content};
    } catch (error) {
      if (deadlineExpired) throw new ApiError(504, 'LOCAL_AI_TIMEOUT');
      if (callerSignal?.aborted) throw new ApiError(499, 'REQUEST_CANCELLED');
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'SERVER_ERROR');
    } finally {
      clearTimeout(timer);
      busy = false;
      if (onAbort) controller.signal.removeEventListener('abort', onAbort);
      callerSignal?.removeEventListener('abort', cancel);
    }
  };
}
export type Gateway = ReturnType<typeof createGateway>;
