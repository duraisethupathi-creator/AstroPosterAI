import type {AstrologyGenerationRequest} from '../../../src/features/astrology/types';
import type {GeneratedContent} from '../../../src/types/generation';
import type {ContentAction} from '../../../src/types/contentStudio';
export interface AstrologyAIProvider {
  generate(request: AstrologyGenerationRequest, signal: AbortSignal, action?: ContentAction): Promise<GeneratedContent>;
}
