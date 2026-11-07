// Validate Endfield Arts checkpoint shape, live-effect ownership and exact action anchors.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {checkArtsCheckpoints} from './arts-checkpoint-validation.mjs';

const read=p=>JSON.parse(readFileSync(p,'utf8'));
const book=read('data/rotations/arknights-endfield/si-tangtang-arcane-xaihi.json');
const schema=read('data/rotation.schema.json');
const ajv=new Ajv2020({allErrors:true,strict:true});addFormats(ajv);
const validate=ajv.compile(schema);
const clone=x=>structuredClone(x);
const annotated=Object.entries(book.stages).filter(([_,s])=>s.artsCheckpoints);
const expected=['maygiPrep','maygiRebuild','maygiBurst','prydwenOne','prydwenTwo','prydwenBurst'];
assert.deepEqual(annotated.map(x=>x[0]),expected);
assert.equal(validate(book),true,ajv.errorsText(validate.errors));

const expectedStages={
 maygiPrep:[[0,0,1,'si','skill'],[2,1,2,'arcane','combo'],[5,2,3,'tangtang','skill'],[7,3,4,'xaihi','combo'],[9,4,'corrosion','arcane','skill']],
 maygiRebuild:[[1,0,1,'si','skill'],[4,1,2,'xaihi','combo'],[6,2,'corrosion','arcane','skill']],
 maygiBurst:[[2,0,1,'tangtang','dive'],[4,1,2,'arcane','combo'],[5,2,3,'arcane','ultimate'],[7,3,'corrosion','arcane','skill']],
 prydwenOne:[[0,0,1,'si','skill'],[1,1,2,'arcane','combo'],[9,2,3,'xaihi','combo'],[10,3,4,'arcane','combo'],[12,4,'corrosion','arcane','skill']],
 prydwenTwo:[[2,0,1,'tangtang','skill'],[4,1,2,'si','skill'],[9,2,3,'xaihi','combo'],[10,3,4,'arcane','combo'],[12,4,'corrosion','arcane','skill']],
 prydwenBurst:[[3,0,1,'tangtang','skill'],[4,1,2,'arcane','combo'],[5,2,3,'arcane','ultimate'],[8,3,4,'tangtang','dive'],[9,4,'corrosion','arcane','skill']]
};
let transitions=0;
for(const [id,stage] of annotated){
 assert.deepEqual(checkArtsCheckpoints(book.game,id,stage),[],id);
 const targets=expectedStages[id];
 assert(targets, 'Stage must have a declared Arts flow: '+id);
 const entries=stage.artsCheckpoints;
 assert.equal(entries.length,targets.length*2,id+' checkpoints');
 for(const [index,pre,post,actor,kind] of targets){
  const pair=entries.filter(x=>x.anchor.actionIndex===index);
  assert.equal(pair.length,2,id+' at action '+index);
  const [before,after]=pair;
  assert.equal(before.anchor.relative,'before');
  assert.equal(after.anchor.relative,'after');
  assert.equal(after.dependsOn,before.id);
  assert.equal(before.status.kind,'infliction');
  assert.equal(before.status.element,'cryo');
  assert.equal(before.status.stacks,pre);
  assert.equal(before.status.assessment,'target');
  assert.equal(before.evidence?.basis,'tc-intent');
  assert.equal(stage.actions[index].input.actor,actor);
  assert.equal(stage.actions[index].input.kind,kind);
  if(post==='corrosion'){
   assert.equal(after.status.kind,'reaction');
   assert.equal(after.status.reaction,'corrosion');
   assert.equal(after.status.assessment,'conditional');
   assert.equal(after.status.level,id.startsWith('maygi')?(id==='maygiPrep'?4:null):4);
  }else{
   assert.equal(after.status.kind,'infliction');
   assert.equal(after.status.element,'cryo');
   assert.equal(after.status.stacks,post);
   assert.equal(after.status.assessment,'target');
  }
  assert(after.condition?.length>15,id+' must document state, hits and cooldown');
  assert.equal(after.evidence?.basis,'live-mechanic');
  transitions++;
 }
 assert.equal(new Set(entries.map(x=>x.id)).size,entries.length,'no duplicate checkpoint IDs');
 assert(!JSON.stringify(entries).match(/(?:\\.png|\\.svg|\\.webp|iconPath|iconSize|romanText)/i),
  'No renderer details in source data');
}
assert.equal(transitions,27,'12 Maygi and 15 Prydwen action-level changes');
assert(book.stages.maygiRebuild.artsCheckpoints.some(x=>x.condition?.includes('Inksoul')),
 'Maygi second Si Skill must remain conditional on Artful Intent');
assert(book.stages.maygiBurst.artsCheckpoints.some(x=>x.condition?.includes('Gloompurger Array')),
 'Maygi WILL Arcane Ultimate 1, not Ultimate 2, generates Cryo');
const fixture=()=>clone(book.stages.prydwenOne);
function failure(label,alter,expected){
 const stage=fixture();alter(stage);
 const result=checkArtsCheckpoints('arknights-endfield',label,stage);
 assert(result.some(error=>error.includes(expected)),label+': expected '+expected+', got '+result.join('; '));
}
failure('duplicate ID',s=>{s.artsCheckpoints[1].id=s.artsCheckpoints[0].id},'duplicate ID');
failure('wrong anchor',s=>{s.artsCheckpoints[0].anchor.actionIndex=100},'out of bounds');
failure('mismatched anchor',s=>{s.artsCheckpoints[1].anchor.actionIndex=2},'SAME action');
failure('invalid dependency',s=>{s.artsCheckpoints[1].dependsOn='missing'},'references unknown');
failure('no reaction caveat',s=>{
 s.artsCheckpoints.find(x=>x.anchor.actionIndex===12&&x.anchor.relative==='after').condition='';
},'must state its assumptions');
failure('unknown numeric pretence',s=>{s.artsCheckpoints[0].status.assessment='unknown'},'unknown assessment must use a null');
failure('invented observation',s=>{s.artsCheckpoints[0].status.assessment='observed'},'requires combat-observation evidence');
failure('zero-source observed',s=>{
 s.artsCheckpoints[0].status.assessment='observed';s.artsCheckpoints[0].evidence.basis='combat-observation';
},'requires encounter/starting-state context');
failure('same-element reaction',s=>{
 s.artsCheckpoints.find(x=>x.anchor.actionIndex===12&&x.anchor.relative==='before').status.element='nature';
},'DIFFERENT preexisting Infliction');
const invalid=clone(book);
invalid.stages.prydwenOne.artsCheckpoints[0].status.stacks=7;
assert.equal(validate(invalid),false,'schema must reject invalid stack count');
const iconLeak=clone(book);
iconLeak.stages.prydwenOne.artsCheckpoints[0].iconPath='arts/arknights-endfield/inflictions/cryo-4.png';
assert.equal(validate(iconLeak),false,'schema must reject icon paths in game data');
assert.equal(book.variants.find(v=>v.id==='maygi').verification,'partial');
assert.equal(book.variants.find(v=>v.id==='prydwen').verification,'partial');
console.log('Validated '+transitions+' Endfield Arts transitions (54 checkpoints); source/action ordering, uncertainty and schema negative tests passed.');
