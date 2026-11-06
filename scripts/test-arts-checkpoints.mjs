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

const expectedPrydwen={
 prydwenOne: [[0,0,1],[1,1,2],[9,2,3],[10,3,4],[12,4,'corrosion']],
 prydwenTwo: [[2,0,1],[4,1,2],[9,2,3],[10,3,4],[12,4,'corrosion']],
 prydwenBurst:[[3,0,1],[4,1,2],[5,2,3],[8,3,4],[9,4,'corrosion']]
};
let transitions=0;
for(const [id,stage] of annotated){
 assert.deepEqual(checkArtsCheckpoints(book.game,id,stage),[],id);
 const entries=stage.artsCheckpoints;
 const targets=id in expectedPrydwen?expectedPrydwen[id]:null;
 assert.equal(entries.length,targets?10:2,id+' checkpoint length');
 if(!targets){
  const [b,a]=entries;
  assert.equal(b.anchor.relative,'before');assert.equal(a.anchor.relative,'after');
  assert.equal(b.anchor.actionIndex,a.anchor.actionIndex);
  assert.equal(a.dependsOn,b.id);
  assert.equal(stage.actions[b.anchor.actionIndex].input.actor,'arcane');
  assert.equal(b.status.element,'cryo');assert.equal(a.status.reaction,'corrosion');
  assert.equal(a.status.assessment,'conditional');
  transitions++;
 }else{
  for(const [ix,pre,post] of targets){
   const pair=entries.filter(cp=>cp.anchor.actionIndex===ix);
   assert.equal(pair.length,2,id+' action '+ix);
   const [before,after]=pair;
   assert.equal(before.anchor.relative,'before');assert.equal(after.anchor.relative,'after');
   assert.equal(after.dependsOn,before.id);
   assert.equal(before.status.kind,'infliction');
   assert.equal(before.status.element,'cryo');
   assert.equal(before.status.stacks,pre);
   assert.equal(before.status.assessment,'target');
   const actual=stage.actions[ix];
   if(post==='corrosion'){
    assert.equal(actual.input.kind,'skill');assert.equal(actual.input.actor,'arcane');
    assert.equal(after.status.kind,'reaction');assert.equal(after.status.reaction,'corrosion');
    assert.equal(after.status.level,4);assert.equal(after.status.assessment,'conditional');
   }else{
    assert.equal(after.status.kind,'infliction');assert.equal(after.status.element,'cryo');
    assert.equal(after.status.stacks,post);assert.equal(after.status.assessment,'target');
    const expectedActor={prydwenOne:['si','arcane','xaihi','arcane'],prydwenTwo:['tangtang','si','xaihi','arcane'],prydwenBurst:['tangtang','arcane','arcane','tangtang']}[id][targets.findIndex(t=>t[0]===ix)];
    assert.equal(actual.input.actor,expectedActor);
   }
   assert(after.condition?.length>15,'Every target outcome explains hit/cooldown/state conditions');
   assert(after.evidence?.basis==='live-mechanic','Every after-effect is backed by a live mechanic');
   assert(before.evidence?.basis==='tc-intent','Before-state remains an unobserved TC target');
   transitions++;
  }
 }
 assert(!JSON.stringify(entries).match(/(?:\.png|\.svg|\.webp|iconPath|iconSize|romanText)/i),
  'No PNG path or rendering data in game-status checkpoints');
}
assert.equal(transitions,18,'Three Maygi Corrosion changes and fifteen Prydwen Arts-changing actions');
const stages=['prydwenOne','prydwenTwo','prydwenBurst'];
for(const id of stages){
 assert.equal(new Set(book.stages[id].artsCheckpoints.map(x=>x.id)).size,10,id+' duplicate ids');
}
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
console.log('Validated '+transitions+' Endfield Arts transitions (36 checkpoints); source/action ordering, uncertainty and schema negative tests passed.');
