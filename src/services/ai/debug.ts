declare const __DEV__: boolean;

// Fixed events and allowlisted metadata only. Never log payloads or exceptions.
export function logAIEvent(event: 'button pressed' | 'request started' | 'HTTP status' | 'response received',
  details?: {backendOrigin?: string; status?: number}, development = typeof __DEV__ !== 'undefined' && __DEV__) {
  if (!development) return;
  console.info(`[AstroPoster AI] ${event}`, details ?? {});
}
