import {Router} from 'express';
import type {Gateway} from '../ai/gateway';
import {parseGenerationBody} from '../validation/generationRequest';
import {ApiError} from '../middleware/errorHandler';
import {markTiming, timedRequest} from '../ai/timing';

export function generateRoute(gateway: Gateway) {
  return Router().post('/api/ai/generate', async (req, res) => timedRequest(async () => {
    markTiming('request received');
    const started = performance.now();
    res.once('finish', () => console.info(JSON.stringify({stage: 'response returned', elapsedMs: Math.round(performance.now() - started)})));
    if (!req.is('application/json')) throw new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE');
    const body = parseGenerationBody(req.body);
    const controller = new AbortController();
    const close = () => { if (!res.writableEnded) controller.abort(); };
    res.once('close', close);
    try { res.json(await gateway(body, controller.signal)); }
    finally { res.off('close', close); }
  }));
}
