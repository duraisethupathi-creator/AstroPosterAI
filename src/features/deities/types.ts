export type DeityId='murugan'|'ganesha'|'shiva'|'amman'|'lakshmi'|'vishnu'|'krishna'|'hanuman'|'saraswati'|'ayyappan'|'saibaba';
export type DeityStyle='traditional'|'temple'|'gold'|'painting'|'minimal'|'divine-glow';
export type DeityMode='none'|'auto'|'manual'|'upload';
export type DeitySelection={mode:DeityMode;deityId?:DeityId;style:DeityStyle;uri?:string;x:number;y:number;width:number;height:number;opacity:number;rotation:number;scale:number};
export const DEFAULT_DEITY_SELECTION:DeitySelection={mode:'none',style:'divine-glow',x:.5,y:.08,width:.28,height:.18,opacity:1,rotation:0,scale:1};
