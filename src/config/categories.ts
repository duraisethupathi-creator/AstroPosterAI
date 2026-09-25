export type PosterCategory = {
  id: string;
  titleTa: string;
  titleEn: string;
  icon: string;
};

export const POSTER_CATEGORIES: PosterCategory[] = [
  { id: 'daily', titleTa: 'தினசரி ராசிபலன்', titleEn: 'Daily Rasi Palan', icon: '☀️' },
  { id: 'weekly', titleTa: 'வார ராசிபலன்', titleEn: 'Weekly Horoscope', icon: '🗓️' },
  { id: 'monthly', titleTa: 'மாத ராசிபலன்', titleEn: 'Monthly Horoscope', icon: '🌙' },
  { id: 'yearly', titleTa: 'வருட ராசிபலன்', titleEn: 'Yearly Horoscope', icon: '✨' },
  { id: 'sani-peyarchi', titleTa: 'சனிப்பெயர்ச்சி', titleEn: 'Saturn Transit', icon: '🪐' },
  { id: 'guru-peyarchi', titleTa: 'குருப்பெயர்ச்சி', titleEn: 'Jupiter Transit', icon: '🌟' },
  { id: 'rahu-ketu', titleTa: 'ராகு கேது பெயர்ச்சி', titleEn: 'Rahu Ketu Transit', icon: '☯️' },
  { id: 'marriage', titleTa: 'திருமண ஜோதிடம்', titleEn: 'Marriage Astrology', icon: '💍' },
  { id: 'career', titleTa: 'தொழில் & வியாபாரம்', titleEn: 'Career & Business', icon: '💼' },
  { id: 'finance', titleTa: 'பணம் & செல்வம்', titleEn: 'Money & Wealth', icon: '🪙' },
  { id: 'pariharam', titleTa: 'பரிகாரம்', titleEn: 'Pariharam', icon: '🪔' },
  { id: 'festival', titleTa: 'சிறப்பு நாள்', titleEn: 'Festival & Special Day', icon: '🙏' }
];

export const ZODIACS = [
  ['aries', 'மேஷம்', 'Aries', '♈'], ['taurus', 'ரிஷபம்', 'Taurus', '♉'],
  ['gemini', 'மிதுனம்', 'Gemini', '♊'], ['cancer', 'கடகம்', 'Cancer', '♋'],
  ['leo', 'சிம்மம்', 'Leo', '♌'], ['virgo', 'கன்னி', 'Virgo', '♍'],
  ['libra', 'துலாம்', 'Libra', '♎'], ['scorpio', 'விருச்சிகம்', 'Scorpio', '♏'],
  ['sagittarius', 'தனுசு', 'Sagittarius', '♐'], ['capricorn', 'மகரம்', 'Capricorn', '♑'],
  ['aquarius', 'கும்பம்', 'Aquarius', '♒'], ['pisces', 'மீனம்', 'Pisces', '♓']
] as const;
