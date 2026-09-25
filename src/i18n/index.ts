export const SUPPORTED_LANGUAGES = [
  {code:'ta', name:'தமிழ்', nativeName:'தமிழ்'},
  {code:'en', name:'English', nativeName:'English'},
  {code:'hi', name:'Hindi', nativeName:'हिन्दी'},
  {code:'te', name:'Telugu', nativeName:'తెలుగు'},
  {code:'kn', name:'Kannada', nativeName:'ಕನ್ನಡ'},
  {code:'ml', name:'Malayalam', nativeName:'മലയാളം'}
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export const translations: Record<LanguageCode, Record<string,string>> = {
 ta:{home:'முகப்பு',create:'உருவாக்கு',brand:'பிராண்ட்',projects:'ப்ராஜெக்ட்ஸ்',settings:'அமைப்புகள்',language:'மொழி',selectLanguage:'மொழியை தேர்வு செய்யவும்',aiLanguage:'AI Content மொழி'},
 en:{home:'Home',create:'Create',brand:'Brand',projects:'Projects',settings:'Settings',language:'Language',selectLanguage:'Select language',aiLanguage:'AI Content language'},
 hi:{home:'होम',create:'बनाएँ',brand:'ब्रांड',projects:'प्रोजेक्ट्स',settings:'सेटिंग्स',language:'भाषा',selectLanguage:'भाषा चुनें',aiLanguage:'AI सामग्री भाषा'},
 te:{home:'హోమ్',create:'సృష్టించు',brand:'బ్రాండ్',projects:'ప్రాజెక్ట్స్',settings:'సెట్టింగ్స్',language:'భాష',selectLanguage:'భాషను ఎంచుకోండి',aiLanguage:'AI కంటెంట్ భాష'},
 kn:{home:'ಮುಖಪುಟ',create:'ರಚಿಸಿ',brand:'ಬ್ರ್ಯಾಂಡ್',projects:'ಪ್ರಾಜೆಕ್ಟ್‌ಗಳು',settings:'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',language:'ಭಾಷೆ',selectLanguage:'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',aiLanguage:'AI ವಿಷಯ ಭಾಷೆ'},
 ml:{home:'ഹോം',create:'സൃഷ്ടിക്കുക',brand:'ബ്രാൻഡ്',projects:'പ്രോജക്റ്റുകൾ',settings:'ക്രമീകരണങ്ങൾ',language:'ഭാഷ',selectLanguage:'ഭാഷ തിരഞ്ഞെടുക്കുക',aiLanguage:'AI ഉള്ളടക്ക ഭാഷ'}
};

let currentLanguage: LanguageCode='ta';
export const getLanguage=()=>currentLanguage;
export const setLanguage=(code:LanguageCode)=>{currentLanguage=code;};
export const t=(key:string)=>translations[currentLanguage][key] ?? translations.en[key] ?? key;
