import {z} from 'zod';

const boolean = z.enum(['true', 'false']).transform(value => value === 'true');
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  AI_MOCK_MODE: boolean.default(false),
  LOCAL_AI_BASE_URL: z.string().url().default('http://127.0.0.1:11434'),
  LOCAL_AI_MODEL: z.string().trim().min(1).max(200).default('qwen3.5:2b-q4_K_M'),
  LOCAL_AI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(60000),
  LOCAL_AI_CONTEXT: z.coerce.number().int().min(2048).max(8192).default(4096),
  LOCAL_AI_MAX_TOKENS: z.coerce.number().int().min(128).max(2048).default(768),
  LOCAL_AI_THINK: boolean.default(false),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  HOST: z.string().default('127.0.0.1'),
  CORS_ORIGINS: z.string().default(''),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(100).default(10),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).max(3600000).default(60000),
  TRUSTED_AUTH_PROXY: boolean.default(false),
});
export type Env = z.infer<typeof schema>;
export function readEnv(input: NodeJS.ProcessEnv): Env {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid backend environment configuration. Check server/.env.example.');
  const env = parsed.data;
  const aiUrl = new URL(env.LOCAL_AI_BASE_URL);
  if (!['http:', 'https:'].includes(aiUrl.protocol) || aiUrl.username || aiUrl.password || aiUrl.search || aiUrl.hash || aiUrl.pathname !== '/') {
    throw new Error('LOCAL_AI_BASE_URL must be an HTTP(S) origin without credentials or a path.');
  }
  // Local only: do not select Ollama cloud-tagged models accidentally.
  if (/:cloud$|-cloud$/.test(env.LOCAL_AI_MODEL)) throw new Error('Cloud models are not supported.');
  for (const origin of env.CORS_ORIGINS.split(',').map(value => value.trim()).filter(Boolean)) {
    try {
      const url = new URL(origin);
      if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) throw new Error();
    } catch { throw new Error('CORS_ORIGINS must contain exact HTTP(S) origins.'); }
  }
  if (!env.AI_MOCK_MODE) {
    if (env.NODE_ENV === 'production' && (!env.TRUSTED_AUTH_PROXY || !['127.0.0.1', '::1'].includes(env.HOST))) {
      throw new Error('Live production requires loopback binding behind an authenticated reverse proxy.');
    }
  }
  return env;
}
