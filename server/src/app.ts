import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type {Env} from './config/env';
import type {Gateway} from './ai/gateway';
import {health} from './routes/health';
import {generateRoute} from './routes/generate';
import {ApiError, errorHandler} from './middleware/errorHandler';
import {generationRateLimit} from './middleware/rateLimit';

export function createApp(env: Env, gateway: Gateway) {
  const app = express();
  app.disable('x-powered-by');
  // Never blindly trust spoofable X-Forwarded-For headers. Auth can be inserted
  // here in a later stage; until then live deployment stays behind a private proxy.
  app.set('trust proxy', false);
  app.use(helmet());
  app.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  const origins = new Set(env.CORS_ORIGINS.split(',').map(value => value.trim()).filter(Boolean));
  app.use(cors({origin(origin, callback) {
    if (!origin || origins.has(origin)) callback(null, true);
    else callback(new ApiError(403, 'ORIGIN_DENIED'));
  }, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type']}));
  app.use(health);
  app.use('/api', generationRateLimit(env));
  app.use(express.json({limit: '24kb', strict: true}));
  app.use(generateRoute(gateway));
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND')));
  app.use(errorHandler);
  return app;
}
