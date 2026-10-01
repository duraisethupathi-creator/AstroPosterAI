import type {LanguageCode} from '../../i18n';
import type {AstrologyCategoryId, AstrologyGenerationRequest, OutputSectionId} from '../astrology/types';
import type {ZodiacId} from '../astrology/zodiac';
import type {BrandSnapshot} from '../../types/brandProfile';
import type {GeneratedContent} from '../../types/generation';
import type {DeitySelection} from '../deities/types';

export type PosterProject = {
  id: string;
  batchId: string;
  createdAt: string;
  updatedAt: string;
  zodiacId: ZodiacId;
  zodiacName: string;
  zodiacSymbol: string;
  language: LanguageCode;
  categoryId: AstrologyCategoryId;
  date?: string;
  content: GeneratedContent;
  brand?: BrandSnapshot;
  request: AstrologyGenerationRequest;
  templateId?: string;
  layoutId?: string;
  backgroundId?: string;
  zodiacStyleId?: string;
  deity?: DeitySelection;
};

export type PosterProjectUpdate = Partial<Pick<PosterProject, 'templateId' | 'layoutId' | 'backgroundId' | 'zodiacStyleId' | 'deity'>> & {
  content?: Partial<Record<OutputSectionId, string>>;
};
