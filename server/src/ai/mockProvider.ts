import {resultLanguage, type ContentAction} from '../../../src/types/contentStudio';
import type {AstrologyGenerationRequest} from '../../../src/features/astrology/types';
import {getCategory} from '../../../src/features/astrology/categories';
import {translate} from '../../../src/i18n';
import type {AstrologyAIProvider} from './types';
import {validateOutput} from './outputSchemas';
import {ZODIACS} from '../../../src/features/astrology/zodiac';

export class MockProvider implements AstrologyAIProvider {
  async generate(request: AstrologyGenerationRequest, _signal?: AbortSignal, action?: ContentAction) {
    const sign = ZODIACS.find(item => item.id === request.zodiacId);
    const name = sign ? translate(resultLanguage(request, action), sign.translationKey) : '';
    return validateOutput(request.categoryId, Object.fromEntries(
      (action?.sectionKey ? [action.sectionKey] : getCategory(request.categoryId).outputSections).map(section => [section,
        `${name ? `${name} — ` : ''}${translate(resultLanguage(request, action), `output.${section}`)}: ${translate(resultLanguage(request, action), 'ai.mockSample')}`]),
    ), action?.sectionKey);
  }
}
