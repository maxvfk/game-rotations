// Semantic checkpoint tests: structure, temporal anchoring, evidence and separation from icon files.
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
const annotated=Object.entries(book.stages).filter(([_,stage])=>stage.artsCheckpoints);
const expected=['maygiPrep','maygiRebuild','maygiBurst','prydwenOne','prydwenTwo','prydwenBurst'];
assert.deepEqual(annotated.map(x=>x[0]),expected,'all selected Corrosion packets, no unverified loop annotation');
assert.equal(validate(book),true,ajv.errorsText(validate.errors));
let tested=0;
for(const [id,stage] of annotated){
 assert.deepEqual(checkArtsCheckpoints(book.game,id,stage),[],id);
 assert.equal(stage.artsCheckpoints.length,2,id);
 const [before,after]=stage.artsCheckpoints;
 assert.equal(before.anchor.relative,'before');assert.equal(after.anchor.relative,'after');
 assert.equal(before.anchor.actionIndex,after.anchor.actionIndex);
 assert.equal(after.dependsOn,before.id);
 const skill=stage.actions[before.anchor.actionIndex];
 assert.equal(skill.input.kind,'skill');assert.equal(skill.input.actor,'arcane');
 assert.equal(before.status.element,'cryo');assert.equal(after.status.reaction,'corrosion');
 assert.equal(before.evidence.basis,'tc-intent');
 assert.equal(after.evidence.basis,'live-mechanic');
 assert.equal(after.status.assessment,'conditional');
 assert.equal(before.status.assessment,before.status.stacks===null?'unknown':'target');
 assert(!JSON.stringify(stage.artsCheckpoints).match(/(?:\.png|\.svg|\.webp|iconPath|iconSize|romanText)/i),
  'metadata must not depend on icon implementation');
 tested++;
}
const first=book.stages.prydwenOne.artsCheckpoints;
assert.equal(first[0].status.stacks,4);
assert.equal(first[1].status.level,4);
assert.equal(first[0].status.assessment,'target');
assert.equal(first[1].status.assessment,'conditional');
for(const [stageId,stage] of annotated){
 if(stageId==='prydwenOne')continue;
 assert.equal(stage.artsCheckpoints[0].status.stacks,null);
 assert.equal(stage.artsCheckpoints[1].status.level,null);
}
const fixture=()=>clone(book.stages.prydwenOne);
function failure(label,alter,expected){
 const stage=fixture();alter(stage);
 const result=checkArtsCheckpoints('arknights-endfield',label,stage);
 assert(result.some(error=>error.includes(expected)),label+': expected '+expected+', got '+result.join('; '));
}
failure('duplicate ID',stage=>{stage.artsCheckpoints[1].id=stage.artsCheckpoints[0].id},'duplicate ID');
failure('wrong anchor',stage=>{stage.artsCheckpoints[0].anchor.actionIndex=100},'out of bounds');
failure('mismatched anchor',stage=>{stage.artsCheckpoints[1].anchor.actionIndex=0},'SAME action');
failure('invalid dependency',stage=>{stage.artsCheckpoints[1].dependsOn='missing'},'references unknown');
failure('no conditional caveat',stage=>{delete stage.artsCheckpoints[1].condition},'must state its assumptions');
failure('unknown numeric pretence',stage=>{
 stage.artsCheckpoints[0].status.assessment='unknown';
},'unknown assessment must use a null');
failure('invented observation',stage=>{
 stage.artsCheckpoints[0].status.assessment='observed';
},'requires combat-observation evidence');
failure('zero-source observed',stage=>{
 stage.artsCheckpoints[0].status.assessment='observed';
 stage.artsCheckpoints[0].evidence.basis='combat-observation';
},'requires encounter/starting-state context');
failure('same-element reaction',stage=>{
 stage.artsCheckpoints[0].status.element='nature';
},'DIFFERENT preexisting Infliction');
failure('WuWa forbidden',()=>{},'only for Endfield');
const negativeSchema=clone(book);
negativeSchema.stages.prydwenOne.artsCheckpoints[0].status.stacks=7;
assert.equal(validate(negativeSchema),false,'schema must reject invalid stack count');
const iconLeak=clone(book);
iconLeak.stages.prydwenOne.artsCheckpoints[0].iconPath='arts/arknights-endfield/inflictions/cryo-4.png';
assert.equal(validate(iconLeak),false,'schema must reject coupling game data to UI image paths');
// No mutation or replacement of authored combat action sequences.
assert.equal(book.variants.find(v=>v.id==='maygi').verification,'partial');
assert.equal(book.variants.find(v=>v.id==='prydwen').verification,'partial');
console.log('Validated '+tested+' source-separated Endfield arts transitions (12 checkpoints) + negative schema/evidence cases.');
