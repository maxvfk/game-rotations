// Endfield Arts checkpoint → action-level visual hint.
// Sourced data defines conditions and before/after semantics; rendering owns PNG,
// CSS and Roman level. Future in-game icon changes require no rotation JSON edits.
import {createArtsInfliction,createArtsReaction,ARTS_NAMES,REACTION_NAMES} from './arts-indicators';
import type {ArtsCheckpoint,ArtsCheckpointStatus} from './rotation-types';
import './arts-checkpoint-view.css';

const make=(tag:string,cls='',text='')=>{
 const node=document.createElement(tag);
 node.className=cls;
 if(text)node.textContent=text;
 return node;
};
const roman=['','I','II','III','IV'];

function statusDescription(status:ArtsCheckpointStatus){
 if(status.kind==='infliction'){
  const count=status.stacks===null?'неизвестно':status.stacks+' из 4';
  return ARTS_NAMES[status.element]+' Infliction, '+count+' стаков'+
   (status.assessment==='target'?' (цель TC, не наблюдение)':status.assessment==='observed'?' (наблюдалось)':' (неизвестное значение)');
 }
 const level=status.level===null?'неизвестен':roman[status.level];
 return REACTION_NAMES[status.reaction]+' Reaction, уровень '+level+
  (status.assessment==='conditional'?' (только при выполнении условий)':status.assessment==='observed'?' (наблюдалось)':' (неизвестный уровень)');
}
function fullDescription(before:ArtsCheckpoint|undefined,after:ArtsCheckpoint|undefined,index:number){
 const lines=['Действие '+(index+1)+': ожидаемое изменение состояния основной цели.'];
 for(const cp of [before,after]){
  if(!cp)continue;
  lines.push((cp.anchor.relative==='before'?'Перед действием: ':'После действия: ')+statusDescription(cp.status)+'.');
  if(cp.condition)lines.push('Условие: '+cp.condition);
  if(cp.evidence?.note)lines.push('Источник/ограничение: '+cp.evidence.note);
 }
 return lines.join(' ');
}
// Keep the action line as a small graphical change marker. Full provenance,
// target/conditional semantics and missing numbers stay in title/ARIA.
function precondition(before:ArtsCheckpoint,base:string){
 const status=before.status;
 const label=make('span','arts-action-prerequisite');
 label.dataset.assessment=status.assessment;
 if(status.kind==='infliction'){
  if(status.stacks===null){
   // Unknown is not a one-stack icon: use the element name only.
   label.append(make('span','arts-action-pre-word',ARTS_NAMES[status.element]));
  }else label.append(createArtsInfliction({element:status.element,stacks:status.stacks,size:24,base}));
 }else{
  const icon=createArtsReaction({reaction:status.reaction,level:status.level,size:24,base});
  if(status.level===null)icon.querySelector('.arts-reaction-level')?.remove();
  label.append(icon);
 }
 return label;
}
function outcome(after:ArtsCheckpoint,base:string){
 const status=after.status;
 const wrap=make('span','arts-action-result');
 wrap.dataset.assessment=status.assessment;
 if(status.kind==='reaction'){
  const icon=createArtsReaction({reaction:status.reaction,level:status.level,size:24,base});
  if(status.level===null)icon.querySelector('.arts-reaction-level')?.remove();
  wrap.append(icon);
 }else if(status.stacks===null){
  wrap.append(make('span','arts-action-result-name',ARTS_NAMES[status.element]));
 }else wrap.append(createArtsInfliction({element:status.element,stacks:status.stacks,size:24,base}));
 return wrap;
}
function actionTransition(before:ArtsCheckpoint|undefined,after:ArtsCheckpoint|undefined,index:number,base:string){
 const box=make('span','arts-action-effect');
 box.dataset.actionIndex=String(index);
 box.dataset.kind=before&&after?'transition':'single';
 box.setAttribute('role','group');
 const description=fullDescription(before,after,index);
 box.setAttribute('aria-label',description);
 box.title=description;
 const visual=make('span','arts-action-visual');
 visual.setAttribute('aria-hidden','true');
 if(before)visual.append(precondition(before,base));
 if(after){
  if(before)visual.append(make('span','arts-action-arrow','→'));
  visual.append(outcome(after,base));
 }
 box.append(visual);
 return box;
}

/** Return only the checkpoints anchored to this exact action; never infer state. */
export function createArtsActionEffect(checkpoints:readonly ArtsCheckpoint[]|undefined,actionIndex:number,base:string){
 if(!checkpoints?.length)return null;
 const relevant=checkpoints.filter(cp=>cp.anchor.actionIndex===actionIndex);
 if(!relevant.length)return null;
 const root=make('span','arts-action-annotations');
 root.dataset.actionIndex=String(actionIndex);
 const used=new Set<string>();
 for(const cp of relevant){
  if(used.has(cp.id)||cp.dependsOn)continue;
  const next=relevant.find(next=>next.dependsOn===cp.id&&next.anchor.relative==='after');
  root.append(actionTransition(cp,next,actionIndex,base));
  used.add(cp.id);
  if(next)used.add(next.id);
 }
 for(const cp of relevant){
  if(used.has(cp.id))continue;
  root.append(actionTransition(undefined,cp,actionIndex,base));
  used.add(cp.id);
 }
 return root.childElementCount?root:null;
}
