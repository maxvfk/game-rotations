// Presentation adapter for Endfield checkpoint metadata.
// This is deliberately independent of rotation JSON layout and of PNG asset paths:
// changing the in-game Arts Reaction level design only requires changing
// createArtsReaction() / its styles, not the source-verified checkpoint records.
import {createArtsInfliction,createArtsReaction,ARTS_NAMES,REACTION_NAMES} from './arts-indicators';
import type {ArtsCheckpoint,ArtsCheckpointStatus} from './rotation-types';
import './arts-checkpoint-view.css';

const make=(tag:string,cls='',text='')=>{
 const e=document.createElement(tag);
 e.className=cls;
 if(text)e.textContent=text;
 return e;
};
const roman=['','I','II','III','IV'];
const ASSESSMENT_LABELS={
 target:'цель',conditional:'если',observed:'факт',unknown:'неизв.',
} as const;

function describeStatus(status:ArtsCheckpointStatus){
 if(status.kind==='infliction'){
  const value=status.stacks===null?'неизвестно':String(status.stacks)+' из 4';
  return ARTS_NAMES[status.element]+' Infliction, стаки '+value+
   ', '+({target:'цель, не наблюдение',observed:'наблюдалось',unknown:'неизвестно'} as const)[status.assessment];
 }
 return REACTION_NAMES[status.reaction]+' Reaction, уровень '+
  (status.level===null?'неизвестен':roman[status.level])+
  ', '+({conditional:'условно, при выполнении требований',observed:'наблюдалось',unknown:'неизвестно'} as const)[status.assessment];
}

function point(cp:ArtsCheckpoint,base:string){
 const holder=make('span','arts-point arts-point-'+cp.status.kind);
 holder.dataset.checkpoint=cp.id;
 holder.dataset.assessment=cp.status.assessment;
 holder.dataset.relative=cp.anchor.relative;
 holder.dataset.actionIndex=String(cp.anchor.actionIndex);
 holder.append(make('span','arts-point-moment',cp.anchor.relative==='before'?'до':'после'));
 if(cp.status.kind==='infliction'){
  holder.append(make('span','arts-point-type',ARTS_NAMES[cp.status.element]),
   createArtsInfliction({element:cp.status.element,stacks:cp.status.stacks,size:24,base}));
 }else{
  holder.append(make('span','arts-point-type',REACTION_NAMES[cp.status.reaction]),
   createArtsReaction({reaction:cp.status.reaction,level:cp.status.level,size:24,base}));
 }
 holder.append(make('span','arts-point-assessment arts-point-assessment-'+cp.status.assessment,
  ASSESSMENT_LABELS[cp.status.assessment]));
 return holder;
}

function evidenceDescription(cp:ArtsCheckpoint){
 const note=cp.evidence?.note||'';
 const assumptions=cp.condition?' Условие: '+cp.condition:'';
 return describeStatus(cp.status)+'. '+note+assumptions;
}

function flow(before:ArtsCheckpoint,after:ArtsCheckpoint|undefined,base:string){
 const group=make('span','arts-checkpoint-flow');
 group.dataset.actionIndex=String(before.anchor.actionIndex);
 group.dataset.kind=after?'transition':'single';
 group.setAttribute('role','group');
 // The group exposes the entire before/after statement as a single accessible
 // narrative. Do not accidentally announce these as two simultaneous debuffs.
 const actionNumber=String(before.anchor.actionIndex+1);
 const descriptions=[
  'Действие '+actionNumber+'. '+(before.anchor.relative==='before'?'До':'После')+': '+evidenceDescription(before),
  after?'После действия '+actionNumber+': '+evidenceDescription(after):'',
 ].filter(Boolean);
 group.setAttribute('aria-label',descriptions.join(' '));
 group.title=descriptions.join('\n');
 const visual=make('span','arts-checkpoint-flow-visual');
 visual.setAttribute('aria-hidden','true');
 visual.append(point(before,base));
 if(after){
  visual.append(make('span','arts-checkpoint-arrow','→'),point(after,base));
 }
 group.append(visual);
 return group;
}

/** Render only explicitly authored checkpoints; no inferred stacks or levels. */
export function createArtsCheckpointSummary(checkpoints:readonly ArtsCheckpoint[]|undefined,base:string){
 if(!checkpoints?.length)return null;
 const result=make('span','stage-arts-summary');
 result.setAttribute('aria-label','Контроль Arts до и после действия');
 const byId=new Map(checkpoints.map(cp=>[cp.id,cp]));
 const included=new Set<string>();
 // A linked reaction follows its exact before-action prerequisite; never
 // render before and after as an unordered collection of active statuses.
 for(const cp of checkpoints){
  if(included.has(cp.id))continue;
  if(cp.dependsOn){
   const prior=byId.get(cp.dependsOn);
   if(prior && !included.has(prior.id))continue; // handled when source appears
  }
  const following=checkpoints.find(next=>next.dependsOn===cp.id);
  result.append(flow(cp,following,base));
  included.add(cp.id);
  if(following)included.add(following.id);
 }
 // Robust fallback for future schema-valid standalone after-states.
 for(const cp of checkpoints){
  if(included.has(cp.id))continue;
  result.append(flow(cp,undefined,base));
  included.add(cp.id);
 }
 return result;
}
