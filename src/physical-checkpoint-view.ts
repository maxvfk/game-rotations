// Physical checkpoints are EXPLICIT authored evidence, not derived by the UI.
// A Vulnerability icon denotes a target snapshot; physical glyph is an EVENT.
import {createPhysicalVulnerability,createPhysicalEffect,PHYSICAL_EFFECT_NAMES} from './physical-indicators';
import type {PhysicalCheckpoint} from './rotation-types';
import './physical-checkpoint-view.css';

const make=(cls:string,text='')=>{
 const node=document.createElement('span');node.className=cls;if(text)node.textContent=text;return node;
};
const details=(cp:PhysicalCheckpoint)=>{
 const status=cp.status;
 const context=status.assessment==='target'?'цель TC, не наблюдение':
  status.assessment==='observed'?'наблюдалось':
  status.assessment==='conditional'?'условно, при выполнении требований':'число неизвестно';
 return (status.kind==='vulnerability'
   ?'Vulnerability, '+(status.stacks===null?'число стаков неизвестно':status.stacks+' из 4 стаков')
   :'Физическое событие '+PHYSICAL_EFFECT_NAMES[status.effect]+', не длительный debuff')+
  ' ('+context+')';
};
function renderStatus(cp:PhysicalCheckpoint,base:string){
 const status=cp.status;
 if(status.kind==='vulnerability')return createPhysicalVulnerability({stacks:status.stacks,size:24,base});
 return createPhysicalEffect({effect:status.effect,size:24,base});
}
/** A single action can have before+after Vulnerability AND an optional effect event.
    No visual arithmetic is performed: each status is author-supplied. */
export function createPhysicalActionEffect(checkpoints:readonly PhysicalCheckpoint[]|undefined,actionIndex:number,base:string){
 if(!checkpoints?.length)return null;
 const at=checkpoints.filter(cp=>cp.anchor.actionIndex===actionIndex);
 if(!at.length)return null;
 const before=at.find(cp=>cp.status.kind==='vulnerability'&&cp.anchor.relative==='before');
 const after=at.find(cp=>cp.status.kind==='vulnerability'&&cp.anchor.relative==='after');
 const event=at.find(cp=>cp.status.kind==='effect'&&cp.anchor.relative==='after');
 if(!before&&!after&&!event)return null;
 const root=make('physical-action-annotations');
 root.dataset.actionIndex=String(actionIndex);
 const box=make('physical-action-effect');
 box.dataset.kind=before&&after?'transition':'single';
 box.setAttribute('role','group');
 const full=['Действие '+(actionIndex+1)+': Physical Status основной цели.'];
 for(const cp of [before,after,event]){
  if(!cp)continue;
  const where=cp.status.kind==='effect'?'Событие после действия':cp.anchor.relative==='before'?'Перед действием':'После действия';
  full.push(where+': '+details(cp)+'.');
  if(cp.condition)full.push('Условие: '+cp.condition+'.');
  if(cp.evidence?.note)full.push('Источник/ограничение: '+cp.evidence.note+'.');
 }
 box.setAttribute('aria-label',full.join(' '));box.title=full.join(' ');
 const visual=make('arts-action-visual physical-action-visual');
 visual.setAttribute('aria-hidden','true');
 if(before){
  const holder=make('arts-action-prerequisite physical-action-before');holder.append(renderStatus(before,base));visual.append(holder);
 }
 if(after){
  if(before)visual.append(make('arts-action-arrow','→'));
  const holder=make('arts-action-result physical-action-after');holder.append(renderStatus(after,base));visual.append(holder);
 }
 if(event){
  if(before||after)visual.append(make('physical-action-event-separator','·'));
  const holder=make('arts-action-result physical-action-event');holder.append(renderStatus(event,base));visual.append(holder);
 }
 box.append(visual);root.append(box);return root;
}
