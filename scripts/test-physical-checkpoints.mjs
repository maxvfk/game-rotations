// Contract tests for an IN-MEMORY synthetic Physical flow; no published Si data changes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {checkPhysicalCheckpoints} from './physical-checkpoint-validation.mjs';

const read=p=>JSON.parse(readFileSync(p,'utf8'));
const book=read('data/rotations/arknights-endfield/si-tangtang-arcane-xaihi.json');
const schema=read('data/rotation.schema.json'),ajv=new Ajv2020({strict:true,allErrors:true});
addFormats(ajv);const validate=ajv.compile(schema),clone=x=>structuredClone(x);
assert.equal(validate(book),true,ajv.errorsText(validate.errors));
assert(Object.values(book.stages).every(stage=>stage.physicalCheckpoints===undefined),
 'Source-backed Physical state has not been researched for published Si; do NOT add fake data');
const fixture=()=>{
 const stage=clone(book.stages.prydwenOne);
 // Fake-only, no gameplay assertion. Even the chosen action is just a schema anchor.
 stage.physicalCheckpoints=[
 {id:'test-before',anchor:{actionIndex:0,relative:'before'},subject:'primary-target',
  status:{kind:'vulnerability',stacks:3,assessment:'target'},
  evidence:{basis:'tc-intent',url:'https://endfield.wiki.gg/wiki/Physical_Status',note:'TEST hypothetical prior state on one target, not measured'}},
 {id:'test-after',anchor:{actionIndex:0,relative:'after'},subject:'primary-target',dependsOn:'test-before',
  status:{kind:'vulnerability',stacks:0,assessment:'conditional'},
  condition:'TEST only if the same target actually had Vulnerability and Crush proc occurred',
  evidence:{basis:'live-mechanic',url:'https://endfield.wiki.gg/wiki/Physical_Status',note:'TEST conditional snapshot, not a measured result'}},
 {id:'test-event',anchor:{actionIndex:0,relative:'after'},subject:'primary-target',
  status:{kind:'effect',effect:'crush',assessment:'conditional'},
  condition:'TEST only if Crush actually hit Vulnerability on the same target; exclude Shatter',
  evidence:{basis:'live-mechanic',url:'https://www.prydwen.gg/arknights-endfield/guides/effects-dictionary',note:'TEST original event glyph, not a permanent debuff'}}];
 return stage;
};
const stage=fixture();
assert.deepEqual(checkPhysicalCheckpoints(book.game,'testStage',stage),[]);
const modified=clone(book);modified.stages.prydwenOne=stage;
assert.equal(validate(modified),true,ajv.errorsText(validate.errors));
function fail(label,mutate,expected){
 const stage=fixture();mutate(stage);
 const errors=checkPhysicalCheckpoints('arknights-endfield',label,stage);
 assert(errors.some(e=>e.includes(expected)),label+': wanted '+expected+'; actual '+errors.join('; '));
}
fail('duplicate',s=>s.physicalCheckpoints[1].id='test-before','duplicate ID');
fail('index',s=>s.physicalCheckpoints[0].anchor.actionIndex=200,'out of bounds');
fail('bad link',s=>s.physicalCheckpoints[1].dependsOn='absent','references unknown');
fail('different action',s=>s.physicalCheckpoints[1].anchor.actionIndex=1,'SAME action');
fail('missing link',s=>delete s.physicalCheckpoints[1].dependsOn,'missing before→after dependsOn');
fail('before event',s=>s.physicalCheckpoints[2].anchor.relative='before','event must be after action');
fail('no event assumption',s=>s.physicalCheckpoints[2].condition='','must state assumptions');
fail('unknown known',s=>{s.physicalCheckpoints[0].status.stacks=2;s.physicalCheckpoints[0].status.assessment='unknown'},'unknown assessment must use null');
fail('observed without proof',s=>{s.physicalCheckpoints[0].status.assessment='observed'},'requires combat-observation');
fail('observed no context',s=>{s.physicalCheckpoints[2].status.assessment='observed';s.physicalCheckpoints[2].evidence.basis='combat-observation';s.physicalCheckpoints[2].condition=''},'requires encounter/starting-state');
assert(checkPhysicalCheckpoints('wuthering-waves','wrongGame',fixture()).some(x=>x.includes('only supported for Endfield')));
const bad=clone(modified);bad.stages.prydwenOne.physicalCheckpoints[0].status.stacks=5;
assert.equal(validate(bad),false,'AJV must reject out-of-range Vulnerability');
const fakeEffect=clone(modified);fakeEffect.stages.prydwenOne.physicalCheckpoints[2].status.effect='shatter';
assert.equal(validate(fakeEffect),false,'Shatter cannot impersonate a basic physical effect');
const badIcon=clone(modified);badIcon.stages.prydwenOne.physicalCheckpoints[0].iconPath='physical/arknights-endfield/vulnerability/vulnerable-3.png';
assert.equal(validate(badIcon),false,'Data schema must reject renderer icon paths');
const noSubject=clone(modified);delete noSubject.stages.prydwenOne.physicalCheckpoints[0].subject;
assert.equal(validate(noSubject),false,'Physical checkpoint target must be explicit');
const notEndfield=clone(modified);notEndfield.game='wuthering-waves';
assert(checkPhysicalCheckpoints(notEndfield.game,'synthetic',notEndfield.stages.prydwenOne).length);
console.log('Physical checkpoint contract: synthetic 3→0 + Crush event valid; all negative cases and existing Si isolation verified.');
