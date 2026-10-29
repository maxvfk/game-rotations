import {readdirSync, readFileSync, existsSync} from 'node:fs';
import {resolve, join} from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = process.cwd();
const read = file => JSON.parse(readFileSync(resolve(root, file), 'utf8'));
const ajv = new Ajv2020({allErrors:true, strict:true});
addFormats(ajv);
const validateRotation = ajv.compile(read('data/rotation.schema.json'));
const validateControls = ajv.compile(read('data/controls.schema.json'));
const catalog = read('data/catalog.json');
const errors = [];
const books = [];
const claimedFiles = new Set();
const teamIds = new Set();
const gameIds = new Set();
const add = (path, message) => errors.push(path+': '+message);
const equalSets = (a,b) => a.size===b.size && [...a].every(v=>b.has(v));

if (catalog.schemaVersion!==1 || !Array.isArray(catalog.games)) {
  errors.push('data/catalog.json: expected schemaVersion=1 and games[]');
} else for (const game of catalog.games) {
  if (!game || typeof game.id!=='string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(game.id)) {
    errors.push('data/catalog.json: invalid game ID');continue;
  }
  if (gameIds.has(game.id))add('data/catalog.json','duplicate game '+game.id);
  gameIds.add(game.id);
  if(!Array.isArray(game.teams)){add('data/catalog.json','missing teams[] for '+game.id);continue}
  if (game.teams.length && game.status!=='available')add('data/catalog.json','game with teams must have status=available: '+game.id);
  if (!game.teams.length && game.status==='available')add('data/catalog.json','available game has no teams: '+game.id);
  for (const team of game.teams) {
    const path='data/rotations/'+game.id+'/'+team.id+'.json';
    claimedFiles.add(path);
    if (teamIds.has(team.id))add('data/catalog.json','duplicate team ID across games: '+team.id);
    teamIds.add(team.id);
    if (!existsSync(resolve(root,path))){errors.push('Missing '+path);continue}
    const book=read(path);books.push(book);
    if(!validateRotation(book)){add(path,ajv.errorsText(validateRotation.errors,{separator:'; '}));continue}
    if(book.id!==team.id || book.game!==game.id)add(path,'catalog ID/game mismatch');
    if(book.controls!==game.id)add(path,'v1 requires book.controls equal game ID');
    if(book.gameVersion!==team.gameVersion)add(path,'gameVersion mismatch with catalog');
    if(book.source!==team.source)add(path,'source mismatch with catalog');
    const chars=new Map(book.characters.map(c=>[c.id,c]));
    if(chars.size!==book.characters.length)add(path,'duplicate character IDs');
    const slotIds=new Set(Object.keys(book.defaultSlots));
    if(!equalSets(slotIds,new Set(chars.keys())))add(path,'defaultSlots do not cover exactly all characters');
    if(new Set(Object.values(book.defaultSlots)).size!==slotIds.size)add(path,'duplicate default slot values');
    const catalogChars=new Map((team.characters||[]).map(c=>[c.id,c]));
    if(!equalSets(new Set(catalogChars.keys()),new Set(chars.keys())))add(path,'catalog character IDs mismatch');
    for (const [id,person] of chars) {
      const inCatalog=catalogChars.get(id);
      if (inCatalog && (inCatalog.portrait!==person.portrait || inCatalog.investment!==person.investment))
        add(path,'character portrait/investment mismatch with catalog: '+id);
      if(!existsSync(resolve(root,'public',person.portrait)))add(path,'missing portrait public/'+person.portrait);
    }
    const variants=new Set();
    const catalogVariants=new Map((team.variants||[]).map(v=>[v.id,v]));
    const used=new Set();
    for(const variant of book.variants){
      if(variants.has(variant.id))add(path,'duplicate variant ID '+variant.id);
      variants.add(variant.id);
      const cv=catalogVariants.get(variant.id);
      if(!cv)add(path,'catalog missing variant '+variant.id);
      else if(cv.verification!==variant.verification)add(path,'variant verification mismatch '+variant.id);
      for(const stageId of [...variant.opener,...variant.loop]){
        used.add(stageId);
        if(!book.stages[stageId])add(path,'missing referenced stage '+stageId);
      }
    }
    if(!equalSets(variants,new Set(catalogVariants.keys())))add(path,'catalog variant set mismatch');
    for(const [stageId,stage] of Object.entries(book.stages)){
      if(!used.has(stageId))add(path,'unreferenced stage '+stageId);
      if(!chars.has(stage.person))add(path,'stage '+stageId+' uses unknown character '+stage.person);
      for(const [index,a] of stage.actions.entries()){
        const k=a.input.kind,label='stage '+stageId+' action '+index;
        if(['outro','swap'].includes(k) && !chars.has(a.input.target))add(path,label+' invalid or absent target '+a.input.target);
        if(!['outro','swap'].includes(k) && a.input.target!==undefined)add(path,label+' target only allowed for outro/swap');
        if(a.input.count!==undefined && k!=='basic')add(path,label+' count only allowed for basic');
        if(a.input.repeat!==undefined && k!=='basic')add(path,label+' repeat only allowed for basic');
      }
    }
    const mapPath='data/controls/'+book.controls+'.json';
    if(!existsSync(resolve(root,mapPath))){add(path,'missing '+mapPath);continue}
    const control=read(mapPath);
    if(!validateControls(control)){add(mapPath,ajv.errorsText(validateControls.errors,{separator:'; '}));continue}
    if(control.game!==book.game)add(mapPath,'controls.game must match book.game');
    const schemeIds=new Set();
    for(const scheme of control.schemes){
      if(schemeIds.has(scheme.id))add(mapPath,'duplicate control scheme '+scheme.id);
      schemeIds.add(scheme.id);
      for(const slot of Object.values(book.defaultSlots))
        if(!Object.hasOwn(scheme.slotKeys,slot))add(mapPath,'scheme '+scheme.id+' missing slot '+slot);
    }
  }
}
const rotationRoot=resolve(root,'data/rotations');
if(existsSync(rotationRoot)){
  for(const gameDir of readdirSync(rotationRoot,{withFileTypes:true})){
    if(!gameDir.isDirectory())continue;
    for(const item of readdirSync(join(rotationRoot,gameDir.name),{withFileTypes:true})){
      if(!item.isFile()||!item.name.endsWith('.json'))continue;
      const path='data/rotations/'+gameDir.name+'/'+item.name;
      if(!claimedFiles.has(path))add(path,'orphan rotation JSON: not listed in data/catalog.json');
    }
  }
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Validated '+books.length+' rotation books, '+books.reduce((n,b)=>n+Object.keys(b.stages).length,0)+' stages and '+books.reduce((n,b)=>n+Object.values(b.stages).reduce((m,s)=>m+s.actions.length,0),0)+' actions');
