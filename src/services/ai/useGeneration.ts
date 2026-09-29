import {useEffect, useRef, useState} from 'react';
import type {AstrologyGenerationRequest} from '../../features/astrology/types';
import type {AstrologyGenerationResult} from '../../types/generation';
import {AIClientError, generateAstrologyContent, type AIClientErrorCode} from './aiClient';

type State = {key: string; loading: boolean; result?: AstrologyGenerationResult; error?: AIClientErrorCode};
export function useGeneration(request: AstrologyGenerationRequest | undefined) {
  const key = JSON.stringify({request});
  const [state, setState] = useState<State>({key, loading: false});
  const active = useRef<AbortController | null>(null);
  useEffect(() => {
    active.current?.abort();
    active.current = null;
    return () => { active.current?.abort(); active.current = null; };
  }, [key]);
  async function generate() {
    if (!request || active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setState({key, loading: true});
    try {
      const result = await generateAstrologyContent(request, {signal: controller.signal});
      if (!controller.signal.aborted) { setState({key, loading: false, result}); return result; }
    } catch (error) {
      if (!controller.signal.aborted) setState({key, loading: false, error: error instanceof AIClientError ? error.code : 'NETWORK_ERROR'});
    } finally { if (active.current === controller) active.current = null; }
  }
  // A late response can never be rendered under a different category/language.
  const visible: State = state.key === key ? state : {key, loading: false};
  return {...visible, generate};
}
