import type {LanguageCode} from '../../i18n';
import type {AstrologyCategoryId, AstrologyGenerationRequest, OutputSectionId} from '../astrology/types';
import type {ZodiacId} from '../astrology/zodiac';
import type {BrandSnapshot} from '../../types/brandProfile';
import type {GeneratedContent} from '../../types/generation';
import type {DeitySelection} from '../deities/types';

export type PosterElementId = 'logo'|'profile'|'deity'|'brand'|'badge'|'title'|'content'|'footer';
export type PosterElementTransform = {x:number;y:number;scale:number;rotation:number;opacity:number};
export type PosterEditorLayout = Partial<Record<PosterElementId, PosterElementTransform>>;
export type PosterSmartDesign = {variant:number;font:number;background:number;smartDesign:number};
export type SocialPlatform = 'instagram'|'facebook'|'whatsapp';
export type SocialContent = {caption:string;description:string;hashtags:string;cta:string};
export type PosterSocialState = {content:SocialContent;platform:SocialPlatform;variant:number};

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
  editorLayout?: PosterEditorLayout;
  smartDesign?: PosterSmartDesign;
  name?: string;
  favorite?: boolean;
  socialContent?: SocialContent;
  socialState?: PosterSocialState;
};

export type PosterProjectUpdate = Partial<Pick<PosterProject, 'templateId' | 'layoutId' | 'backgroundId' | 'zodiacStyleId' | 'deity' | 'editorLayout' | 'smartDesign' | 'name' | 'favorite' | 'socialContent' | 'socialState'>> & {
  content?: Partial<Record<OutputSectionId, string>>;
};
