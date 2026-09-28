import type {AstrologyGenerationRequest} from '../../../src/features/astrology/types';
import {getCategory} from '../../../src/features/astrology/categories';
import {translate} from '../../../src/i18n';
import type {AstrologyAIProvider} from './types';
import {validateOutput} from './outputSchemas';

export class MockProvider implements AstrologyAIProvider {
  async generate(request: AstrologyGenerationRequest) {
    return validateOutput(request.categoryId, Object.fromEntries(
      getCategory(request.categoryId).outputSections.map(section => [section,
        `${translate(request.language, `output.${section}`)}: ${translate(request.language, 'ai.mockSample')}`]),
    ));
  }
}
