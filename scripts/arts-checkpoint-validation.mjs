// Domain-level validation for optional, presentation-independent Endfield Arts checkpoints.
// AJV validates shape; these checks enforce intent, chronology and evidence semantics.
const ELEMENTS=new Set(['heat','electric','cryo','nature']);
const REACTION_TRIGGER={combustion:'heat',electrification:'electric',solidification:'cryo',corrosion:'nature'};

export function checkArtsCheckpoints(game,stageId,stage){
 const items=stage.artsCheckpoints;
 if(items===undefined)return [];
 const errors=[],idMap=new Map(),occupied=new Set();
 const add=message=>errors.push('stage '+stageId+': '+message);
 if(game!=='arknights-endfield')add('Arts checkpoints currently supported only for Endfield');
 if(!Array.isArray(items)||items.length===0)return [...errors,'stage '+stageId+': artsCheckpoints must be a nonempty array'];
 for(const [i,cp] of items.entries()){
  const label='checkpoint '+i+' '+(cp?.id||'<missing>');
  if(!cp||typeof cp!=='object') {add(label+' invalid record');continue;}
  if(idMap.has(cp.id))add('duplicate ID '+cp.id);
  idMap.set(cp.id,cp);
  const ix=cp.anchor?.actionIndex;
  if(!Number.isInteger(ix)||ix<0||ix>=stage.actions.length){add(label+' actionIndex out of bounds');continue;}
  const action=stage.actions[ix];
  const anchor=ix+':'+cp.anchor.relative+':'+cp.status.kind+':'+(cp.status.element||cp.status.reaction);
  if(occupied.has(anchor))add(label+' duplicate moment+status');
  occupied.add(anchor);
  if(cp.subject!==undefined&&cp.subject!=='primary-target')add(label+' subject unsupported');
  const status=cp.status,amount=status.kind==='infliction'?status.stacks:status.level;
  if(status.assessment==='unknown'&&amount!==null)add(label+' unknown assessment must use a null amount');
  if(status.assessment!=='unknown'&&amount===null&&status.assessment!=='conditional')
   add(label+' known/target assessment requires exact amount');
  if(status.assessment==='conditional'){
   if(cp.anchor.relative!=='after')add(label+' conditional result must be after its action');
   if(!cp.condition||cp.condition.trim().length<10)add(label+' conditional outcome must state its assumptions');
  }
  if(status.assessment==='observed'){
   if(cp.evidence?.basis!=='combat-observation')add(label+' observed state requires combat-observation evidence');
   if(!cp.condition||cp.condition.trim().length<10)add(label+' observed state requires encounter/starting-state context');
  }
  if(cp.evidence?.basis==='combat-observation'&&status.assessment!=='observed')
   add(label+' combat-observation evidence may only label an actually observed status');
  if(status.kind==='reaction'&&cp.anchor.relative==='before'&&status.assessment==='conditional')
   add(label+' before state cannot be an after-cast conditional result');
  if(status.kind==='reaction'&&!(status.reaction in REACTION_TRIGGER))add(label+' unknown reaction');
  if(status.kind==='infliction'&&!ELEMENTS.has(status.element))add(label+' unknown infliction');
  // An action-index anchor only asserts association with the authored action:
  // not frame-accurate impact timing or a guaranteed proc.
  if(cp.dependsOn&&cp.dependsOn===cp.id)add(label+' cannot depend on itself');
  if(cp.anchor.relative==='after'&&cp.dependsOn&&!action.input)
   add(label+' missing action for reaction');
 }
 for(const cp of items){
  if(!cp?.dependsOn)continue;
  const prior=idMap.get(cp.dependsOn);
  if(!prior){add(cp.id+' dependsOn references unknown checkpoint '+cp.dependsOn);continue;}
  if(prior.anchor.actionIndex!==cp.anchor.actionIndex||prior.anchor.relative!=='before'||cp.anchor.relative!=='after')
   add(cp.id+' dependsOn must connect before→after of the SAME action');
  // Do not make a reaction look like an existing Infliction simultaneously.
  if(cp.status.kind==='reaction'&&prior.status.kind==='infliction'){
   if(prior.status.element===REACTION_TRIGGER[cp.status.reaction])
    add(cp.id+' reaction requires a DIFFERENT preexisting Infliction from the triggering element');
   // Existing stronger reaction statuses may persist on refresh; a post-reaction
   // Status Level is not universally equal to the newly consumed stacks.
   if(prior.status.stacks===0&&cp.status.level!==null)
    add(cp.id+' cannot react from zero Infliction stacks');
  }
 }
 return errors;
}
