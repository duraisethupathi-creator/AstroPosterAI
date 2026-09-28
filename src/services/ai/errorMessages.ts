import type {TranslationKey} from '../../i18n';
import type {AIClientErrorCode} from './aiClient';
export const AI_ERROR_MESSAGES: Record<AIClientErrorCode, TranslationKey> = {
  INVALID_REQUEST: 'ai.invalidRequest', BULK_NOT_SUPPORTED: 'ai.bulkLater', RATE_LIMITED: 'ai.rateLimited',
  BODY_TOO_LARGE: 'ai.invalidRequest', ORIGIN_DENIED: 'ai.serviceUnavailable',
  UNSUPPORTED_MEDIA_TYPE: 'ai.invalidRequest', NOT_FOUND: 'ai.serviceUnavailable', SERVER_ERROR: 'ai.failed',
  NETWORK_ERROR: 'ai.serviceUnavailable', CLIENT_TIMEOUT: 'ai.timeout', INVALID_RESPONSE: 'ai.invalidResponse',
  NOT_CONFIGURED: 'ai.serviceUnavailable', CANCELLED: 'ai.cancelled',
  LOCAL_AI_NOT_RUNNING: 'ai.serviceUnavailable', LOCAL_AI_MODEL_NOT_FOUND: 'ai.serviceUnavailable',
  LOCAL_AI_CONNECTION_ERROR: 'ai.serviceUnavailable', LOCAL_AI_TIMEOUT: 'ai.timeout',
  LOCAL_AI_INVALID_OUTPUT: 'ai.invalidResponse',
  REQUEST_CANCELLED: 'ai.cancelled',
};
