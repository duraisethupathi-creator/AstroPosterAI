import {rateLimit} from 'express-rate-limit';
import type {Env} from '../config/env';
export function generationRateLimit(env: Env) {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS, limit: env.RATE_LIMIT_MAX,
    standardHeaders: 'draft-8', legacyHeaders: false,
    message: {success: false, error: {code: 'RATE_LIMITED'}},
  });
}
