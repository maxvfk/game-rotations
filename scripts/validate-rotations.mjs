import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root=process.cwd();
const read=path=>JSON.parse(readFileSync(resolve(root,path),'utf8'));
const schema=read('data/rotation.schema.json');
const ajv=new Ajv2020({allErrors:true,strict:true});
addFormats(ajv);
const check=ajv.compile(schema);
const catalog=read('data/catalog.json');
const books=[];
let errors=[];
for(const game of catalog.games){
 for(const team of game.teams){
  const path='data/rotations/'+game.id+'/'+team.id+'.json';
  if(!existsSync(resolve(root,path))){errors.push('Missing '+path);continue}
  const book=read(path);books.push(book);
  if(!check(book)){errors.push(path+': '+ajv.errorsText(check.errors,{separator:'; '}));continue}
  if(book.id!==team.id||book.game!==game.id)errors.push(path+': catalog ID/game mismatch');
  const characters=new Set(book.characters.map(c=>c.id));
  if(characters.size!==book.characters.length)errors.push(path+': duplicate character IDs');
  if(JSON.stringify([...characters].sort())!==JSON.stringify(Object.keys(book.defaultSlots).sort()))errors.push(path+': slots do not cover characters');
  if(new Set(Object.values(book.defaultSlots)).size!==characters.size)errors.push(path+': slots are not unique');
  if(book.variants.length!==new Set(book.variants.map(v=>v.id)).size)errors.push(path+': duplicate variants');
  const mapPath='data/controls/'+book.controls+'.json';
  if(!existsSync(resolve(root,mapPath))){errors.push(path+': missing controls '+mapPath);continue}
  const ctrl=read(mapPath);
  if(ctrl.game!==book.game)errors.push(path+': control map belongs to another game');
  if(!Array.isArray(ctrl.schemes)||ctrl.schemes.length===0)errors.push(path+': empty control schemes');
  for(const scheme of ctrl.schemes||[]){
   const expected=['basic','heavy','skill','ultimate','echo','dodge','auto','repeat'];
   for(const k of expected)if(!scheme.keys?.[k])errors.push(mapPath+': missing key for '+scheme.id+'/'+k);
   for(const slot of Object.values(book.defaultSlots))if(!(slot in (scheme.slotKeys||{})))errors.push(mapPath+': missing '+scheme.id+' slot '+slot);
  }
  const used=new Set();
  for(const variant of book.variants){
   if(!team.variants?.some(v=>v.id===variant.id))errors.push(path+': catalog missing variant '+variant.id);
   for(const stage of [...variant.opener,...variant.loop]){
    used.add(stage);
    if(!book.stages[stage])errors.push(path+': missing stage '+stage);
   }
  }
  for(const [id,stage] of Object.entries(book.stages)){
   if(!used.has(id))errors.push(path+': unreferenced stage '+id);
   if(!characters.has(stage.person))errors.push(path+': stage '+id+' unknown character '+stage.person);
   for(const a of stage.actions){
    if(['intro','outro','swap'].includes(a.input.kind) && a.input.kind!=='intro'&&!characters.has(a.input.target))errors.push(path+': '+id+' invalid swap target '+a.input.target);
    if(a.input.target&&!['outro','swap'].includes(a.input.kind))errors.push(path+': invalid target on '+a.input.kind);
    if(a.input.repeat&&a.input.kind!=='basic')errors.push(path+': repeat non-basic action');
    if(a.input.count&&a.input.kind!=='basic')errors.push(path+': count non-basic action');
   }
  }
  for(const person of book.characters){
   const portrait='public/'+person.portrait;
   if(!existsSync(resolve(root,portrait)))errors.push(path+': missing portrait '+portrait);
  }
 }
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Validated '+books.length+' rotation books, '+books.reduce((n,b)=>n+Object.keys(b.stages).length,0)+' stages and '+books.reduce((n,b)=>n+Object.values(b.stages).reduce((s,x)=>s+x.actions.length,0),0)+' actions');
