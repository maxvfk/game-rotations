// Reusable, purely visual Endfield Arts status widgets.
// Images are exact, SHA-pinned game sprites from data/arts/arknights-endfield.json.
// Never infer an Arts state from a combat action sequence or a team name.
import artsRegistry from '../data/arts/arknights-endfield.json';
import './arts-indicators.css';

export type ArtsElement=keyof typeof artsRegistry.inflictions;
export type ArtsReaction=keyof typeof artsRegistry.reactions;
export type ArtsIconSize=24|28|32;
export type ArtsStackCount=0|1|2|3|4|null;
export type ArtsReactionLevel=1|2|3|4|null;

export const ARTS_ELEMENTS=['heat','electric','cryo','nature'] as const satisfies readonly ArtsElement[];
export const ARTS_REACTIONS=['combustion','electrification','solidification','corrosion'] as const satisfies readonly ArtsReaction[];
export const ARTS_SIZES=[24,28,32] as const satisfies readonly ArtsIconSize[];

export const ARTS_NAMES:Record<ArtsElement,string>={
 heat:'Heat',electric:'Electric',cryo:'Cryo',nature:'Nature',
};
export const REACTION_NAMES:Record<ArtsReaction,string>={
 combustion:'Combustion',electrification:'Electrification',
 solidification:'Solidification',corrosion:'Corrosion',
};

const ROMAN=['','I','II','III','IV'] as const;
const el=(tag:string,cls='',value='')=>{
 const node=document.createElement(tag);node.className=cls;
 if(value)node.textContent=value;
 return node;
};
const isIntegerBetween=(x:number,a:number,b:number)=>Number.isInteger(x)&&x>=a&&x<=b;
function sizeStyle(node:HTMLElement,size:ArtsIconSize){
 if(!ARTS_SIZES.includes(size))throw new RangeError('Arts icon size must be 24, 28 or 32 px');
 node.style.setProperty('--arts-icon-size',size+'px');
}
function setIcon(img:HTMLImageElement,holder:HTMLElement,path:string,base:string,size:ArtsIconSize){
 img.src=base+path;img.alt='';img.setAttribute('aria-hidden','true');
 img.width=size;img.height=size;img.loading='lazy';img.decoding='async';
 img.addEventListener('error',()=>{
  // Do not load remote backups or display the browser's broken-image graphic.
  img.replaceWith(el('span','arts-indicator-fallback','?'));
  holder.classList.add('arts-icon-unavailable');
 },{once:true});
 holder.append(img);
}

export function createArtsInfliction(options:{
 element:ArtsElement;stacks:ArtsStackCount;size?:ArtsIconSize;base:string;
}):HTMLSpanElement{
 const {element,stacks,base}=options,size=options.size??28;
 const record=artsRegistry.inflictions[element];
 if(!record)throw new Error('Unknown Arts Infliction: '+element);
 if(stacks!==null&&!isIntegerBetween(stacks,0,4))
  throw new RangeError('Infliction stacks must be an integer from 0 to 4 or null');
 const label=stacks===null?'неизвестно число стаков':stacks===0?'0/4 стаков':stacks+'/4 стаков';
 const span=el('span','arts-indicator arts-infliction') as HTMLSpanElement;
 span.dataset.kind='infliction';span.dataset.element=element;span.dataset.stacks=stacks===null?'unknown':String(stacks);
 span.setAttribute('role','img');span.setAttribute('aria-label',ARTS_NAMES[element]+' Infliction: '+label);
 span.title=ARTS_NAMES[element]+' Infliction · '+label;
 sizeStyle(span,size);
 if(stacks===null||stacks===0){
  // There is no canonical 0-stack or unknown-stack PNG; avoid inventing a ring.
  span.classList.add('arts-empty');
  span.append(el('span','arts-empty-mark',stacks===null?'?':'—'));
  return span;
 }
 const icon=record.artworks.find(entry=>entry.stacks===stacks);
 if(!icon)throw new Error('Missing Arts Infliction sprite '+element+'/'+stacks);
 const img=document.createElement('img');img.className='arts-indicator-img';
 setIcon(img,span,icon.path,base,size);
 return span;
}

export function createArtsReaction(options:{
 reaction:ArtsReaction;level:ArtsReactionLevel;size?:ArtsIconSize;base:string;
}):HTMLSpanElement{
 const {reaction,level,base}=options,size=options.size??28;
 const record=artsRegistry.reactions[reaction];
 if(!record)throw new Error('Unknown Arts Reaction: '+reaction);
 if(level!==null&&!isIntegerBetween(level,1,4))
  throw new RangeError('Arts Reaction level must be I-IV or null');
 const levelText=level===null?'?':ROMAN[level];
 const span=el('span','arts-indicator arts-reaction') as HTMLSpanElement;
 span.dataset.kind='reaction';span.dataset.reaction=reaction;
 span.dataset.level=level===null?'unknown':String(level);
 // All four source-pinned reaction sprites share the approved in-icon level
 // treatment; unknown levels retain the gallery's explicit unknown state.
 if(level!==null)span.classList.add('arts-reaction-level-overlay');
 span.setAttribute('role','img');
 span.setAttribute('aria-label',REACTION_NAMES[reaction]+' · уровень '+(level===null?'неизвестен':levelText));
 span.title=REACTION_NAMES[reaction]+' · '+(level===null?'уровень неизвестен':'уровень '+levelText);
 sizeStyle(span,size);
 const img=document.createElement('img');img.className='arts-indicator-img';
 setIcon(img,span,record.icon.path,base,size);
 span.append(el('span','arts-reaction-level',levelText));
 if(level===null)span.classList.add('arts-level-unknown');
 return span;
}
