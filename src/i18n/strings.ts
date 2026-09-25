export type Language = 'ta' | 'en';

export const strings = {
  ta: {
    home: 'முகப்பு', create: 'உருவாக்கு', brand: 'பிராண்ட்', projects: 'ப்ராஜெக்ட்ஸ்', settings: 'அமைப்புகள்',
    generate: 'உருவாக்கு', edit: 'திருத்து', export: 'Export', shuffle: 'Design மாற்று'
  },
  en: {
    home: 'Home', create: 'Create', brand: 'Brand', projects: 'Projects', settings: 'Settings',
    generate: 'Generate', edit: 'Edit', export: 'Export', shuffle: 'Shuffle Design'
  }
} as const;
