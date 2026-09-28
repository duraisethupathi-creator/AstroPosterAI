import {config} from 'dotenv';
import {readEnv} from './config/env';
import {createApp} from './app';
import {createGateway} from './ai/gateway';

config({quiet: true});
try {
  const env = readEnv(process.env);
  const server = createApp(env, createGateway(env)).listen(env.PORT, env.HOST, () => {
    console.info(`AstroPoster backend listening on port ${env.PORT} (${env.AI_MOCK_MODE ? 'MOCK' : 'LIVE'} mode).`);
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.on('error', () => { console.error('Backend could not listen. Check host/port configuration.'); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => server.close());
} catch {
  console.error('Backend startup failed. Check server/.env against server/.env.example. No credentials are logged.');
  process.exitCode = 1;
}
