// Visual-only Physical Status icon library for Endfield.
// Original sprites and damage-text glyphs are pinned in data/physical/arknights-endfield.json.
// A physical effect glyph is NOT an enemy's persistent status or proof of a proc.
import registry from '../data/physical/arknights-endfield.json';
import './arts-indicators.css';
import './physical-indicators.css';

export type PhysicalEffect=keyof typeof registry.effects;
export type PhysicalStacks=0|1|2|3|4|null;
export type PhysicalIconSize=24|28|32;

export const PHYSICAL_EFFECTS=['lift','knock-down','crush','breach'] as const satisfies readonly PhysicalEffect[];
export const PHYSICAL_ICON_SIZES=[24,28,32] as const satisfies readonly PhysicalIconSize[];
export const PHYSICAL_EFFECT_NAMES:Record<PhysicalEffect,string>={
 lift:'Lift', 'knock-down':'Knock Down',crush:'Crush',breach:'Breach',
};
export const PHYSICAL_EFFECT_BEHAVIORS:Record<PhysicalEffect,string>={
 lift:'При Vulnerability добавляет один стек, Stagger и возможный подъём',
 'knock-down':'При Vulnerability добавляет один стек, Stagger и возможное опрокидывание',
 crush:'При Vulnerability расходует все стаки для Physical DMG',
 breach:'При Vulnerability расходует все стаки и усиливает получаемый Physical DMG',
};

function make(cls:string):HTMLSpanElement{
 const span=document.createElement('span');span.className='arts-indicator '+cls;return span;
}
function sized(span:HTMLSpanElement,size:PhysicalIconSize){
 if(!PHYSICAL_ICON_SIZES.includes(size))throw new RangeError('Physical icon size must be 24, 28 or 32');
 span.style.setProperty('--arts-icon-size',size+'px');
}
function addSprite(root:HTMLSpanElement,url:string,size:PhysicalIconSize){
 const img=document.createElement('img');img.className='arts-indicator-img physical-icon-img';
 img.src=url;img.alt='';img.setAttribute('aria-hidden','true');img.width=size;img.height=size;
 img.loading='lazy';img.decoding='async';
 img.addEventListener('error',()=>{
  img.replaceWith(Object.assign(document.createElement('span'),{className:'arts-indicator-fallback',textContent:'?'}));
  root.classList.add('arts-icon-unavailable');
 },{once:true});
 root.append(img);
}

/** Null/zero do not have corresponding in-game sprite: never invent a stack ring. */
export function createPhysicalVulnerability(options:{stacks:PhysicalStacks;size?:PhysicalIconSize;base:string}):HTMLSpanElement{
 const {stacks,base}=options,size=options.size??28;
 if(stacks!==null&&(!Number.isInteger(stacks)||stacks<0||stacks>4))
  throw new RangeError('Vulnerability stacks must be 0..4 or null');
 const root=make('physical-vulnerability');sized(root,size);
 root.dataset.kind='vulnerability';root.dataset.stacks=stacks===null?'unknown':String(stacks);
 const label=stacks===null?'неизвестное количество стаков':stacks===0?'0/4 стаков':stacks+'/4 стаков';
 root.setAttribute('role','img');root.setAttribute('aria-label','Vulnerability: '+label);root.title='Vulnerability · '+label;
 if(stacks===null||stacks===0){
  root.classList.add('arts-empty');
  const placeholder=document.createElement('span');placeholder.className='arts-empty-mark';
  placeholder.textContent=stacks===null?'?':'—';root.append(placeholder);return root;
 }
 const icon=registry.vulnerability.artworks.find(x=>x.stacks===stacks);
 if(!icon)throw new Error('Missing pinned Vulnerability sprite for '+stacks);
 addSprite(root,base+icon.path,size);return root;
}

/** Event/skill glyph, not a persistent physical-status icon. No invented stack count or level. */
export function createPhysicalEffect(options:{effect:PhysicalEffect;size?:PhysicalIconSize;base:string}):HTMLSpanElement{
 const {effect,base}=options,size=options.size??28,record=registry.effects[effect];
 if(!record)throw new Error('Unknown physical effect '+effect);
 const root=make('physical-effect');sized(root,size);
 root.dataset.kind='physical-effect';root.dataset.effect=effect;root.dataset.behavior=record.behavior;
 root.setAttribute('role','img');
 root.setAttribute('aria-label',PHYSICAL_EFFECT_NAMES[effect]+' — '+PHYSICAL_EFFECT_BEHAVIORS[effect]);
 root.title=PHYSICAL_EFFECT_NAMES[effect]+' · '+PHYSICAL_EFFECT_BEHAVIORS[effect];
 addSprite(root,base+record.icon.path,size);return root;
}
