import {SUPPORTED_LANGUAGES, translate} from '../../i18n';
import type {GeneratedContent} from '../../types/generation';
import {ZODIACS, type ZodiacId} from './zodiac';

// Native stems cover grammatical suffixes (e.g. கும்ப ராசி / கும்பராசிக்காரர்கள்).
// Latin names use word boundaries so “library” and “Leonard” are not zodiac mentions.
const aliases: Record<ZodiacId, string[]> = {
  aries: ['mesham', 'mesha', 'மேஷ', 'மேச', 'మేష', 'മേട'],
  taurus: ['rishabam', 'rishabham', 'vrishabha', 'ரிஷப', 'இடப', 'వృషభ', 'ഇടവ'],
  gemini: ['mithunam', 'mithuna', 'மிதுன', 'మిథున', 'മിഥുന'],
  cancer: ['kadagam', 'katakam', 'karka', 'கடக', 'కర్కాటక', 'കർക്കടക'],
  leo: ['simmam', 'simha', 'சிம்ம', 'சிங்க', 'సింహ', 'ചിങ്ങ'],
  virgo: ['kanni', 'kanya', 'கன்னி', 'కన్య', 'ಕನ್ಯ', 'കന്നി'],
  libra: ['thulam', 'tulam', 'tula', 'துலா', 'తుల', 'ತುಲ', 'തുലാ'],
  scorpio: ['viruchigam', 'vrischika', 'விருச்சிக', 'వృశ్చిక', 'വൃശ്ചിക'],
  sagittarius: ['dhanusu', 'dhanus', 'dhanu', 'தனுசு', 'ధనుస్సు', 'ധനു'],
  capricorn: ['magaram', 'makaram', 'makara', 'மகர', 'మకర', 'മകര'],
  aquarius: ['kumbam', 'kumbham', 'kumbha', 'கும்ப', 'कुम्भ', 'కుంభ', 'കുംഭ'],
  pisces: ['meenam', 'minam', 'meena', 'மீன', 'మీన', 'മീന'],
};
const normalize = (text: string) => text.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase();
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = ZODIACS.map(sign => ({id: sign.id, symbol: sign.symbol,
  names: [...new Set([sign.id, ...SUPPORTED_LANGUAGES.map(language => translate(language.code, sign.translationKey)), ...aliases[sign.id]])]
    .map(name => normalize(name)).map(name => new RegExp(`(?<![\\p{L}\\p{M}])${escape(name)}${/^[a-z]+$/.test(name) ? '(?![\\p{L}\\p{M}])' : ''}`, 'u')),
}));

export function hasZodiacConflict(content: GeneratedContent, selected?: ZodiacId): boolean {
  if (!selected) return false;
  return Object.values(content).some(value => typeof value === 'string' && patterns.some(sign =>
    sign.id !== selected && (value.includes(sign.symbol) || sign.names.some(pattern => pattern.test(normalize(value))))));
}
