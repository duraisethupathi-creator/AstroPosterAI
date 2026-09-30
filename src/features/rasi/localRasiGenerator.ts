import {getCategory} from '../astrology/categories';
import {ZODIACS, type ZodiacId} from '../astrology/zodiac';
import type {AstrologyGenerationRequest, OutputSectionId} from '../astrology/types';
import type {AstrologyGenerationResult} from '../../types/generation';

const copy = <T,>(v:T):T => JSON.parse(JSON.stringify(v));
const zodiacIndex=(id?:ZodiacId)=>Math.max(0,ZODIACS.findIndex(z=>z.id===id));

const DATA = {
  ta: {
    general:['இன்று புதிய வாய்ப்புகள் திறக்கும் நாள். நிதானமாக எடுத்த முடிவுகள் நல்ல பலன் தரும்.','உங்கள் முயற்சிக்கு நல்ல முன்னேற்றம் கிடைக்கும். முக்கிய செயல்களில் கவனம் செலுத்துங்கள்.','மனதில் தெளிவும் செயல்களில் நம்பிக்கையும் அதிகரிக்கும் நாள்.'],
    career:['பணியில் முன்னேற்றம் காணலாம். பொறுப்புகளை திட்டமிட்டு செயல்படுத்துங்கள்.','புதிய யோசனைகள் பாராட்டைப் பெறலாம். சக ஊழியர்களுடன் நல்ல ஒத்துழைப்பு இருக்கும்.','தொழில் முயற்சிகளில் நிதானமான முன்னேற்றம் கிடைக்கும்.'],
    finance:['செலவுகளை திட்டமிட்டு நடத்துவது சேமிப்பை மேம்படுத்தும்.','பண விஷயங்களில் அவசர முடிவுகளை தவிர்த்து கவனமாக செயல்படுங்கள்.','வரவு செலவை சமநிலைப்படுத்த நல்ல நாள்.'],
    love:['உறவுகளில் அன்பான உரையாடல் நெருக்கத்தை அதிகரிக்கும்.','குடும்பத்தினருடன் இனிய நேரம் அமையும். புரிதல் மேம்படும்.','மனதில் இருப்பதை அமைதியாக பகிர்வது உறவை வலுப்படுத்தும்.'],
    health:['உடல் நலத்தில் சமநிலை இருக்கும். ஓய்வு மற்றும் நீர்ச்சத்தை கவனியுங்கள்.','சிறிய நடைப்பயிற்சி மற்றும் நேரமான உணவு புத்துணர்ச்சி தரும்.','மன அமைதிக்காக ஓய்வுக்கும் தூக்கத்துக்கும் முக்கியத்துவம் கொடுங்கள்.'],
    positiveMessage:['நம்பிக்கையுடன் முன்னேறுங்கள்; சிறிய முயற்சியும் நல்ல மாற்றத்தை உருவாக்கும்.','இன்றைய நேர்மறை எண்ணம் நாளைய வெற்றிக்கு அடித்தளம்.','உங்கள் திறமையை நம்பி அமைதியாக முன்னேறுங்கள்.'],
    overview:['இந்த காலம் நிதானமான முன்னேற்றத்தையும் புதிய அனுபவங்களையும் தரும்.'], impact:['மாற்றங்களை கவனமாக ஏற்றுக்கொண்டால் நல்ல பலன் கிடைக்கும்.'], guidance:['திட்டமிட்டு செயல்பட்டு அவசர முடிவுகளை தவிர்க்கவும்.'], remedy:['அமைதியான மனதுடன் வழிபாடு செய்து நல்ல எண்ணங்களை வளர்த்துக் கொள்ளுங்கள்.']
  },
  en: {
    general:['A steady day with room for useful progress and fresh opportunities.','Your focused efforts can bring encouraging progress today.','Clarity and confidence can help you make practical choices today.'],
    career:['Plan your priorities and move forward steadily at work.','Fresh ideas may be appreciated; teamwork can support progress.','Consistent effort can create useful professional momentum.'],
    finance:['Plan expenses carefully and keep long-term priorities in view.','Avoid rushed money decisions and review details carefully.','A balanced approach to spending and saving can help today.'],
    love:['Warm, patient conversations can strengthen close relationships.','Quality time with loved ones can improve understanding.','Share your thoughts calmly and listen with care.'],
    health:['Keep a balanced routine with rest, hydration and gentle movement.','A simple walk and regular meals can support your wellbeing.','Give enough attention to rest and a calm mind today.'],
    positiveMessage:['Move ahead with confidence; small steps can create meaningful change.','A positive approach today can support tomorrow’s progress.','Trust your strengths and keep moving forward calmly.'],
    overview:['This period supports steady progress and thoughtful new experiences.'], impact:['Adapting carefully to change can bring constructive results.'], guidance:['Plan well, stay patient and avoid rushed decisions.'], remedy:['Choose a peaceful routine, reflection and positive intentions.']
  }
} as const;

function languagePack(lang:string){ return lang==='ta'?DATA.ta:DATA.en; }
function pick(list:readonly string[], n:number){return list[n%list.length];}
function generic(section:OutputSectionId, req:AstrologyGenerationRequest, n:number):string {
  const p=languagePack(req.language); const key=section as keyof typeof p;
  const found=p[key]; if(Array.isArray(found)) return pick(found,n);
  if(section==='luckyNumber') return String(((n*2+3)%9)+1);
  if(section==='luckyColour') return req.language==='ta'?['சிவப்பு','பச்சை','நீலம்','தங்கம்','வெள்ளை'][n%5]:['Red','Green','Blue','Gold','White'][n%5];
  if(section==='title') return req.language==='ta'?'இன்றைய ஜோதிட வழிகாட்டல்':'Astrology guidance';
  if(section==='message') return req.language==='ta'?'நம்பிக்கையுடன் நல்ல எண்ணங்களோடு நாளை தொடங்குங்கள்.':'Begin with confidence and positive intentions.';
  if(section==='greeting') return req.language==='ta'?'இனிய வாழ்த்துகள்!':'Warm wishes!';
  if(section==='blessing') return req.language==='ta'?'முருகன் அருள் உங்கள் வாழ்வில் அமைதியும் நம்பிக்கையும் தரட்டும்.':'May divine blessings bring peace and confidence.';
  if(section==='tips') return req.language==='ta'?'திட்டமிடல், நிதானம், நல்ல உரையாடல் ஆகியவற்றுக்கு முக்கியத்துவம் கொடுங்கள்.':'Prioritize planning, patience and clear communication.';
  if(section==='cta') return req.language==='ta'?'மேலும் அறிய தொடர்பு கொள்ளுங்கள்.':'Contact us to learn more.';
  if(section==='headline') return req.language==='ta'?'உங்கள் ஜோதிட வழிகாட்டல்':'Your astrology guidance';
  if(section==='description') return req.language==='ta'?'எளிய மற்றும் தெளிவான ஜோதிட உள்ளடக்கம்.':'Simple, clear astrology content.';
  return req.language==='ta'?'நிதானமாக செயல்பட்டு நேர்மறையாக முன்னேறுங்கள்.':'Stay patient, positive and move forward steadily.';
}

export async function generateLocalRasiContent(request:AstrologyGenerationRequest):Promise<AstrologyGenerationResult>{
  if(!request.zodiacId) throw new Error('ZODIAC_REQUIRED');
  const category=getCategory(request.categoryId);
  const n=zodiacIndex(request.zodiacId);
  const content=Object.fromEntries(category.outputSections.map((section,i)=>[section,generic(section,request,n+i)]));
  await new Promise(resolve=>setTimeout(resolve,120));
  return {success:true,mode:'mock',categoryId:request.categoryId,language:request.language,zodiacId:request.zodiacId,content};
}
