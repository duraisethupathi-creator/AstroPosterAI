export type PosterTemplate = {
  id: string; name: string; icon: string; accent: string; background: string;
  title: string; body: string; borderWidth: number; radius: number;
  align: 'left' | 'center'; fontFamily?: 'serif'; labelTransform?: 'uppercase';
};

export const POSTER_TEMPLATES: PosterTemplate[] = [
  {id:'traditional',name:'Traditional',icon:'🪔',accent:'#E8B96A',background:'#10241E',title:'#FFF4DA',body:'#F5EEE2',borderWidth:2,radius:24,align:'left',fontFamily:'serif'},
  {id:'premium-gold',name:'Premium Gold',icon:'✨',accent:'#E8C97D',background:'#11131E',title:'#FFF7E7',body:'#EEE9F2',borderWidth:3,radius:26,align:'left'},
  {id:'modern',name:'Modern',icon:'🎨',accent:'#7DD3FC',background:'#101827',title:'#F8FAFC',body:'#E2E8F0',borderWidth:1,radius:18,align:'left'},
  {id:'temple',name:'Temple',icon:'🛕',accent:'#F2A65A',background:'#2A1511',title:'#FFE9C7',body:'#F7E3D0',borderWidth:3,radius:12,align:'center',fontFamily:'serif'},
  {id:'zodiac-focus',name:'Zodiac',icon:'♒',accent:'#C9B6FF',background:'#171329',title:'#F4EEFF',body:'#E7DFFC',borderWidth:2,radius:28,align:'center'},
  {id:'murugan',name:'Murugan',icon:'🔱',accent:'#FFB85C',background:'#351314',title:'#FFF0D0',body:'#FFE5D2',borderWidth:3,radius:30,align:'center',fontFamily:'serif'},
  {id:'minimal',name:'Minimal',icon:'◻️',accent:'#D6B46A',background:'#F8F5EE',title:'#201D18',body:'#34312C',borderWidth:1,radius:8,align:'left'},
  {id:'cosmic',name:'Cosmic',icon:'🌌',accent:'#B794F6',background:'#090B22',title:'#F8F5FF',body:'#DDD8EE',borderWidth:2,radius:24,align:'left'},
  {id:'dark-luxury',name:'Dark Luxury',icon:'👑',accent:'#D4AF37',background:'#080808',title:'#FFF6D6',body:'#E9E1CF',borderWidth:2,radius:20,align:'left',labelTransform:'uppercase'},
];
export const DEFAULT_TEMPLATE_ID='premium-gold';
export function getPosterTemplate(id?: string){return POSTER_TEMPLATES.find(t=>t.id===id) ?? POSTER_TEMPLATES[1];}
