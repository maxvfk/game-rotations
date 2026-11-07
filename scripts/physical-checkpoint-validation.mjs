// Physical check: Vulnerability is target state; effects are discrete action
// events, never persistent debuffs. No inferred stacks/levels/triggers.
const EFFECTS=new Set(['lift','knock-down','crush','breach']);
export function checkPhysicalCheckpoints(game,stageId,stage){
 const items=stage.physicalCheckpoints;
 if(items===undefined)return [];
 const errors=[],idMap=new Map(),slots=new Set(),groups=new Map();
 const add=s=>errors.push('stage '+stageId+': '+s);
 if(game!=='arknights-endfield')add('physicalCheckpoints only supported for Endfield');
 if(!Array.isArray(items)||!items.length){add('physicalCheckpoints must be nonempty');return errors;}
 for(const [i,cp] of items.entries()){
  const label='physical checkpoint '+i+' '+(cp?.id??'<missing>');
  if(!cp||typeof cp!=='object'){add(label+' invalid record');continue;}
  if(idMap.has(cp.id))add('duplicate ID '+cp.id);
  idMap.set(cp.id,cp);
  const ix=cp.anchor?.actionIndex,relative=cp.anchor?.relative,status=cp.status;
  if(!Number.isInteger(ix)||ix<0||ix>=stage.actions.length){add(label+' actionIndex out of bounds');continue;}
  if(!['before','after'].includes(relative)){add(label+' invalid relative');continue;}
  if(cp.subject!=='primary-target')add(label+' requires primary-target subject');
  if(!status||!['vulnerability','effect'].includes(status.kind)){add(label+' invalid physical status');continue;}
  const slot=ix+':'+relative+':'+status.kind;
  if(slots.has(slot))add(label+' duplicate moment/status at action');
  slots.add(slot);
  const group=groups.get(ix)||{};groups.set(ix,group);
  if(status.kind==='vulnerability'){
   if(![0,1,2,3,4,null].includes(status.stacks))add(label+' invalid stacks');
   group[relative]=cp;
   if(status.assessment==='unknown'&&status.stacks!==null)add(label+' unknown assessment must use null');
   if(['target','observed'].includes(status.assessment)&&status.stacks===null)add(label+' exact assessment requires numeric stacks');
   if(relative==='before'&&status.assessment==='conditional')add(label+' before state cannot be conditional');
  }else{
   if(!EFFECTS.has(status.effect))add(label+' unknown effect');
   if(relative!=='after')add(label+' effect event must be after action');
   if(cp.dependsOn)add(label+' effect event cannot dependOn snapshot');
   group.event=cp;
  }
  if(status.assessment==='conditional'){
   if(relative!=='after')add(label+' conditional outcome must be after action');
   if(!cp.condition||cp.condition.trim().length<10)add(label+' conditional outcome must state assumptions');
  }
  if(status.assessment==='observed'){
   if(cp.evidence?.basis!=='combat-observation')add(label+' observed requires combat-observation');
   if(!cp.condition||cp.condition.trim().length<10)add(label+' observed requires encounter/starting-state context');
  }
  if(cp.evidence?.basis==='combat-observation'&&status.assessment!=='observed')add(label+' combat observation cannot back an unobserved status');
  if(cp.dependsOn===cp.id)add(label+' self-dependency');
 }
 for(const cp of items){
  if(!cp?.dependsOn)continue;
  const prior=idMap.get(cp.dependsOn);
  if(!prior){add(cp.id+' dependsOn references unknown ID');continue;}
  if(cp.status?.kind!=='vulnerability'||prior.status?.kind!=='vulnerability'||cp.anchor.relative!=='after'||
   prior.anchor.relative!=='before'||cp.anchor.actionIndex!==prior.anchor.actionIndex)
    add(cp.id+' dependsOn must pair Vulnerability before→after SAME action');
  if(prior.subject!==cp.subject)add(cp.id+' mixed targets across transition');
 }
 for(const [ix,g] of groups){
  if(g.before&&g.after&&g.after.dependsOn!==g.before.id)add('action '+ix+' missing before→after dependsOn');
  if(g.after?.dependsOn&&!g.before)add('action '+ix+' dependsOn without before snapshot');
 }
 return errors;
}
