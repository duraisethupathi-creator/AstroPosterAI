import {z} from 'zod';
import type {Env} from '../config/env';
import type {AstrologyGenerationRequest} from '../../../src/features/astrology/types';
import type {AstrologyAIProvider} from './types';
import {ApiError} from '../middleware/errorHandler';
import {buildPrompt} from './promptBuilder';
import {outputJsonSchema, parseOutput} from './outputSchemas';
import {markTiming} from './timing';

const envelope = z.object({done: z.literal(true), message: z.object({content: z.string().max(20000)})});
type Message = {role: 'system' | 'user' | 'assistant'; content: string};

async function boundedJson(response: Response): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new ApiError(502, 'LOCAL_AI_INVALID_OUTPUT');
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 131072) throw new ApiError(502, 'LOCAL_AI_INVALID_OUTPUT');
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    if (error instanceof SyntaxError) throw new ApiError(502, 'LOCAL_AI_INVALID_OUTPUT');
    throw error;
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

export class LocalAIProvider implements AstrologyAIProvider {
  constructor(private readonly env: Env, private readonly fetcher: typeof fetch = fetch) {}

  private async call(messages: Message[], request: AstrologyGenerationRequest, signal: AbortSignal) {
    markTiming('local AI call started');
    let response: Response;
    try {
      response = await this.fetcher(`${this.env.LOCAL_AI_BASE_URL.replace(/\/$/, '')}/api/chat`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, signal, redirect: 'error',
        body: JSON.stringify({model: this.env.LOCAL_AI_MODEL, stream: false, think: this.env.LOCAL_AI_THINK,
          messages, format: outputJsonSchema(request.categoryId), keep_alive: '5m',
          options: {temperature: 0, num_ctx: this.env.LOCAL_AI_CONTEXT, num_predict: this.env.LOCAL_AI_MAX_TOKENS}}),
      });
    } catch (error) {
      if (signal.aborted) throw new ApiError(499, 'REQUEST_CANCELLED');
      const cause = error instanceof Error ? error.cause : undefined;
      const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
      throw new ApiError(503, code === 'ECONNREFUSED' ? 'LOCAL_AI_NOT_RUNNING' : 'LOCAL_AI_CONNECTION_ERROR');
    }
    markTiming('local AI response received');
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 404) throw new ApiError(503, 'LOCAL_AI_MODEL_NOT_FOUND');
      if (response.status === 408 || response.status === 504) throw new ApiError(504, 'LOCAL_AI_TIMEOUT');
      if (response.status >= 500) throw new ApiError(502, 'SERVER_ERROR');
      throw new ApiError(503, 'LOCAL_AI_CONNECTION_ERROR');
    }
    const parsed = envelope.safeParse(await boundedJson(response));
    if (!parsed.success) throw new ApiError(502, 'LOCAL_AI_INVALID_OUTPUT');
    return parsed.data.message.content;
  }

  async generate(request: AstrologyGenerationRequest, signal: AbortSignal) {
    const prompt = buildPrompt(request);
    const messages: Message[] = [{role: 'system', content: prompt.instructions},
      {role: 'user', content: `${prompt.input}\nRequired JSON schema: ${JSON.stringify(outputJsonSchema(request.categoryId))}`}];
    // Both calls share the gateway's one deadline. Transport/model failures are
    // never retried. Only invalid model output is eligible for one repair.
    for (let attempt = 0; attempt < 2; attempt++) {
      let raw = '';
      try {
        raw = await this.call(messages, request, signal);
        return parseOutput(request.categoryId, raw);
      } catch (error) {
        if (signal.aborted) throw new ApiError(499, 'REQUEST_CANCELLED');
        if (!(error instanceof ApiError)) throw new ApiError(503, 'LOCAL_AI_CONNECTION_ERROR');
        if (error.code !== 'LOCAL_AI_INVALID_OUTPUT' || attempt === 1) throw error;
        markTiming('local AI repair started');
        if (raw) messages.push({role: 'assistant', content: raw.slice(0, 4000)});
        messages.push({role: 'user', content: 'Repair the previous output. Return ONLY one JSON object matching the required schema. Every required value must be a non-empty short string in the requested language. No markdown or explanation.'});
      }
    }
    throw new ApiError(502, 'LOCAL_AI_INVALID_OUTPUT');
  }
}
