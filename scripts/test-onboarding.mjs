import {mkdtempSync, cpSync, mkdirSync, writeFileSync, rmSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd(),work=mkdtempSync(join(tmpdir(),'rotations-onboarding-'));
const file=p=>join(work,p),read=p=>JSON.parse(readFileSync(file(p),'utf8'));
const write=(p,obj)=>writeFileSync(file(p),JSON.stringify(obj,null,2)+'\n');
const runner=resolve(root,'scripts/validate-rotations.mjs');
function validate(expectSuccess,name){
 const result=spawnSync(process.execPath,[runner],{cwd:work,encoding:'utf8',timeout:20000});
 const output=(result.stdout||'')+(result.stderr||'');
 if((result.status===0)!==expectSuccess){
  throw new Error(name+': expected '+(expectSuccess?'PASS':'FAIL')+' but got '+result.status+'\n'+output);
 }
 console.log('✓ '+name);
}
function baseFixture(){
 const book=JSON.parse(readFileSync(resolve(root,'examples/rotation-template.json'),'utf8'));
 const controls=JSON.parse(readFileSync(resolve(root,'examples/controls-template.json'),'utf8'));
 const team=JSON.parse(readFileSync(resolve(root,'examples/catalog-team.json'),'utf8'));
 const catalog=JSON.parse(readFileSync(resolve(root,'data/catalog.json'),'utf8'));
 catalog.games.push({id:'example-game',name:'Example game (not published)',shortName:'Demo',mark:'✦',accent:'#99bbcc',status:'available',subtitle:'Temporary validation fixture',teams:[team]});
 write('data/catalog.json',catalog);
 write('data/rotations/example-game/example-alpha-beta.json',book);
 write('data/controls/example-game.json',controls);
 return {book,controls,team,catalog};
}
try{
 cpSync(resolve(root,'data'),file('data'),{recursive:true});
 mkdirSync(file('public'),{recursive:true});
 cpSync(resolve(root,'public/portraits'),file('public/portraits'),{recursive:true});
 mkdirSync(file('data/rotations/example-game'),{recursive:true});
 for(const id of ['alpha','beta'])writeFileSync(file('public/portraits/example-'+id+'.webp'),'fake-fixture-not-for-deployment');
 baseFixture();
 validate(true,'new fictitious game + catalog + two schemes validates');
 {
  const {book}=baseFixture();
  book.stages.alphaOpener.actions.at(-1).input.target='nonexistent';
  write('data/rotations/example-game/example-alpha-beta.json',book);
  validate(false,'outro to an unknown character is rejected');
 }
 {
  const {book}=baseFixture();
  book.variants[0].loop.push('missingStage');
  write('data/rotations/example-game/example-alpha-beta.json',book);
  validate(false,'variant referencing absent stage is rejected');
 }
 {
  const {book}=baseFixture();
  book.stages.alphaOpener.actions[0].input.kind='wrong-kind';
  write('data/rotations/example-game/example-alpha-beta.json',book);
  validate(false,'unsupported input kind is rejected by JSON schema');
 }
 {
  const {controls}=baseFixture();
  delete controls.schemes[0].keys.basic;
  write('data/controls/example-game.json',controls);
  validate(false,'incomplete control map is rejected');
 }
 {
  const {catalog}=baseFixture();
  catalog.games[0].teams.push(catalog.games.at(-1).teams[0]);
  write('data/catalog.json',catalog);
  validate(false,'duplicate globally unique team ID is rejected');
 }
 {
  baseFixture();
  write('data/rotations/example-game/unlisted.json',{schemaVersion:1});
  validate(false,'orphan rotation JSON not linked from catalog is rejected');
 }
 console.log('All onboarding fixture tests passed (no new game published).');
}finally{rmSync(work,{recursive:true,force:true})}
