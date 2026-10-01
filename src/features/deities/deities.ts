import type {DeityId,DeitySelection,DeityStyle} from './types';
export type Deity={id:DeityId;name:string;icon:string;styles:DeityStyle[]};
const styles:DeityStyle[]=['traditional','temple','gold','painting','minimal','divine-glow'];
export const DEITIES:Deity[]=[
{id:'murugan',name:'Murugan',icon:'🔱',styles},{id:'ganesha',name:'Ganesha',icon:'🕉️',styles},{id:'shiva',name:'Shiva',icon:'🔱',styles},
{id:'amman',name:'Parvati / Amman',icon:'🌺',styles},{id:'lakshmi',name:'Lakshmi',icon:'🪷',styles},{id:'vishnu',name:'Vishnu / Perumal',icon:'🙏',styles},
{id:'krishna',name:'Krishna',icon:'🪈',styles},{id:'hanuman',name:'Hanuman',icon:'🚩',styles},{id:'saraswati',name:'Saraswati',icon:'🎶',styles},
{id:'ayyappan',name:'Ayyappan',icon:'🛕',styles},{id:'saibaba',name:'Sai Baba',icon:'🙏',styles},
];
export function deityFor(id?:DeityId){return DEITIES.find(x=>x.id===id)}
export function resolveAutoDeity(templateId?:string):DeityId {
 if(templateId==='murugan') return 'murugan'; if(templateId==='temple') return 'ganesha'; if(templateId==='traditional') return 'lakshmi'; return 'murugan';
}
export function effectiveDeity(selection?:DeitySelection,templateId?:string){if(!selection||selection.mode==='none'||selection.mode==='upload')return undefined;return deityFor(selection.mode==='auto'?resolveAutoDeity(templateId):selection.deityId)}
