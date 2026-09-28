import type {AstrologyGenerationRequest} from '../../../src/features/astrology/types';
import type {GeneratedContent} from '../../../src/types/generation';
export interface AstrologyAIProvider {
  generate(request: AstrologyGenerationRequest, signal: AbortSignal): Promise<GeneratedContent>;
}
