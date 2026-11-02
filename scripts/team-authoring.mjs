// Small authoring-time helper. The site stays a static JSON + Vite PWA.
// Usage: node scripts/team-authoring.mjs add --spec path [--write]
//        node scripts/team-authoring.mjs sync [--team team-id] [--check|--write]
import {readFileSync,writeFileSync,existsSync,mkdtempSync,cpSync,mkdirSync,rmSync,renameSync,unlinkSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root=process.cwd();
const scriptDirectory=dirname(fileURLToPath(import.meta.url));
const validator=join(scriptDirectory,'validate-rotations.mjs');
const args=process.argv.slice(2);
const mode=args.shift();
const indexOf=flag=>args.indexOf(flag);
const has=flag=>args.includes(flag);
const value=flag=>{const i=indexOf(flag);return i<0?null:args[i+1]};
const write=has('--write'),check=has('--check');
const die=(message)=>{throw new Error(message)};
const read=(path)=>JSON.parse(readFileSync(resolve(root,path),'utf8'));
const json=(value)=>JSON.stringify(value,null,2)+'\n';
const stable=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const slug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const stageId=/^[A-Za-z][A-Za-z0-9]*$/;
const text=(v,label)=>{if(typeof v!=='string'||!v.trim())die('Missing or empty '+label);return v.trim()};
const id=(v,label)=>{text(v,label);if(!slug.test(v))die(label+' must be kebab-case');return v};
const assert=(ok,message)=>{if(!ok)die(message)};
const catalogPath='data/catalog.json';
const currentCatalog=read(catalogPath);
const buildSchema=read('data/rotation.schema.json');
const ajv=new Ajv2020({allErrors:true,strict:true});addFormats(ajv);
const valid=ajv.compile(buildSchema);

function projectValidate(book,catalog,bookPath){
 const tmp=mkdtempSync(join(tmpdir(),'rotation-authoring-'));
 try{
  cpSync(resolve(root,'data'),join(tmp,'data'),{recursive:true});
  mkdirSync(join(tmp,'public'),{recursive:true});
  cpSync(resolve(root,'public/portraits'),join(tmp,'public/portraits'),{recursive:true});
  if(book&&bookPath){
   const full=join(tmp,bookPath);mkdirSync(dirname(full),{recursive:true});writeFileSync(full,json(book));
  }
  writeFileSync(join(tmp,catalogPath),json(catalog));
  const result=spawnSync(process.execPath,[validator],{cwd:tmp,encoding:'utf8',timeout:30000});
  if(result.status!==0)die('Validation failed, nothing written:\n'+(result.stderr||'')+(result.stdout||''));
 }finally{rmSync(tmp,{recursive:true,force:true})}
}

function deriveCard(book,previous={}){
 const oldChars=new Map((previous.characters||[]).map(x=>[x.id,x]));
 const oldVariants=new Map((previous.variants||[]).map(x=>[x.id,x]));
 return {
  id:book.id,
  name:previous.name??book.title,
  subtitle:previous.subtitle??book.catalogSubtitle,
  characters:book.characters.map(c=>({
   id:c.id,name:oldChars.get(c.id)?.name??c.name,
   investment:c.investment,portrait:c.portrait
  })),
  status:previous.status??book.catalogStatus,
  statusDescription:previous.statusDescription??book.catalogStatusDescription,
  gameVersion:book.gameVersion,
  source:book.source,
  variants:book.variants.map(v=>({id:v.id,name:oldVariants.get(v.id)?.name??v.label,verification:v.verification}))
 };
}
function derivedFromBook(book,previous){
 if(previous)return deriveCard(book,previous);
 assert(text(book.catalogSubtitle,'catalog subtitle')&&text(book.catalogStatus,'catalog status')&&text(book.catalogStatusDescription,'catalog status description'),'');
 return deriveCard(book);
}
function validateNoDuplicateTeam(catalog,teamId){
 for(const game of catalog.games)for(const team of game.teams){
  if(team.id===teamId)return {game:game.id,team};
 }
 return null;
}
function requireEvidence(evidence){
 assert(evidence&&typeof evidence==='object'&&!Array.isArray(evidence),'spec.evidence required');
 for(const k of ['author','liveKit','resources','triggers','swaps','buffWindows','userSelection','limitations','codeTesting','uiTesting','offlineTesting','combatTesting']){
  const value=text(evidence[k],'evidence.'+k);
  if(write&&/\b(?:TODO|TBD|TEST|PLACEHOLDER)\b/i.test(value))die('Unresolved evidence.'+k+': '+value);
 }
}
function portraitFor(gameId,c){
 const manifestPath='data/portraits/'+gameId+'.json';
 const canonical=c.portraitId??c.id;
 if(existsSync(resolve(root,manifestPath))){
  const manifest=read(manifestPath);
  const target=(manifest.aliases||{})[canonical]??canonical;
  const record=manifest.characters.find(x=>x.id===target);
  if(!record)die('No canonical portrait for '+gameId+'/'+canonical+' in '+manifestPath);
  if(c.portrait && c.portrait!==record.portrait)die('Portrait override conflicts with canonical registry for '+c.id);
  if(c.name && c.name!==record.name)die('Character name conflicts with canonical registry for '+c.id+'; omit name');
  return {name:record.name,portrait:record.portrait};
 }
 return {name:text(c.name,'character '+c.id+' name'),portrait:text(c.portrait,'character '+c.id+' portrait')};
}
function generate(spec){
 assert(spec.schemaVersion===1,'spec schemaVersion must be 1');
 id(spec.game,'game');id(spec.id,'team ID');
 const game=currentCatalog.games.find(x=>x.id===spec.game);
 assert(game,'Unknown game '+spec.game+' in catalog');
 assert(existsSync(resolve(root,'data/controls/'+spec.game+'.json')),'Missing game controls; onboard controls before publishing a first team');
 assert(Array.isArray(spec.characters)&&spec.characters.length>=2&&spec.characters.length<=5,'spec.characters must have 2-5 members');
 assert(Array.isArray(spec.variants)&&spec.variants.length>=1,'spec.variants must be non-empty');
 assert(spec.stages&&typeof spec.stages==='object'&&!Array.isArray(spec.stages)&&Object.keys(spec.stages).length,'spec.stages required');
 requireEvidence(spec.evidence);
 if(write){
  // This is a publication guard, not an assertion of gameplay correctness.
  const unresolved=(function walk(v,where='spec'){
   if(typeof v==='string')return /\b(?:TODO|TBD|TEST|PLACEHOLDER|FICTIONAL)\b/i.test(v)?where:null;
   if(Array.isArray(v)){for(let i=0;i<v.length;i++){const found=walk(v[i],where+'['+i+']');if(found)return found}}
   else if(v&&typeof v==='object'){for(const [key,value] of Object.entries(v)){const found=walk(value,where+'.'+key);if(found)return found}}
   return null;
  })(spec);
  if(unresolved)die('Unresolved publication placeholder in '+unresolved+'; complete the authoring spec first');
  if(/example\.org|invalid\.example/i.test(spec.source))die('Replace the fictional source URL before --write');
 }
 const charIds=new Set(),slots=new Set();
 const defaultSlots={};
 const characters=spec.characters.map(c=>{
  id(c.id,'character ID');
  assert(!charIds.has(c.id),'Duplicate character ID '+c.id);charIds.add(c.id);
  const slot=String(c.slot);
  assert(/^\d+$/.test(slot)&&!slots.has(slot),'Slot must be an unused number: '+slot);
  slots.add(slot);defaultSlots[c.id]=slot;
  const {name,portrait}=portraitFor(spec.game,c);
  const glyph=c.glyph??name[0];text(glyph,'glyph');
  const color=c.color??game.accent;
  assert(/^#[0-9a-fA-F]{6}$/.test(color),'Invalid character color '+color);
  return {id:c.id,name,glyph,color,portrait,investment:text(c.investment,'investment '+c.id)};
 });
 for(const [stage,v] of Object.entries(spec.stages)){
  assert(stageId.test(stage),'Invalid stage id '+stage);
  assert(charIds.has(v.person),'Unknown person '+v.person+' for stage '+stage);
 }
 const book={schemaVersion:1,id:spec.id,game:spec.game,title:text(spec.title,'title'),
  gameVersion:text(spec.gameVersion,'gameVersion'),source:text(spec.source,'source'),
  verificationNote:text(spec.verificationNote,'verificationNote'),
  characters,controls:spec.game,defaultSlots,
  variants:spec.variants.map(v=>{const copy={...v};delete copy.catalogName;return copy}),
  stages:spec.stages};
 if(!valid(book))die('Rotation schema invalid: '+ajv.errorsText(valid.errors,{separator:'; '}));
 const card=derivedFromBook({...book,catalogSubtitle:text(spec.subtitle,'subtitle'),catalogStatus:text(spec.status,'status'),catalogStatusDescription:text(spec.statusDescription,'statusDescription')});
 return {book,card};
}
function saveCatalog(catalog){
 const path=resolve(root,catalogPath),tmp=path+'.authoring-tmp';
 try{writeFileSync(tmp,json(catalog),{flag:'wx'});renameSync(tmp,path)}
 finally{if(existsSync(tmp))unlinkSync(tmp)}
}
function addTeam(specPath){
 assert(!check,'add accepts --write or dry-run only');
 text(specPath,'--spec');
 const spec=JSON.parse(readFileSync(resolve(root,specPath),'utf8'));
 const {book,card}=generate(spec),path='data/rotations/'+book.game+'/'+book.id+'.json';
 const catalog=structuredClone(currentCatalog);
 const game=catalog.games.find(x=>x.id===book.game);
 const match=validateNoDuplicateTeam(catalog,book.id);
 const exists=existsSync(resolve(root,path));
 if(match||exists){
  if(!match||match.game!==book.game||!exists)die('Partial existing team '+book.id+'; refusing to overwrite');
  const stored=read(path);
  if(!stable(stored,book)||!stable(match.team,card))die('Team '+book.id+' already exists with different data; use sync, never overwrite via add');
  console.log('Unchanged: '+book.id+' already exists with identical book+catalog.');
  return;
 }
 game.teams.push(card);
 if(game.status!=='available')game.status='available';
 projectValidate(book,catalog,path);
 if(!write){console.log('DRY RUN: validated '+book.id+' -> '+path+' + data/catalog.json; pass --write to publish files');return}
 const target=resolve(root,path);
 mkdirSync(dirname(target),{recursive:true});
 try{writeFileSync(target,json(book),{flag:'wx'});saveCatalog(catalog)}
 catch(error){if(existsSync(target)&&!validateNoDuplicateTeam(read(catalogPath),book.id))unlinkSync(target);throw error}
 console.log('CREATED '+path+' and synchronized catalog; no existing team modified');
}
function syncCatalog(){
 assert(!write||!check,'Use only one of --check or --write');
 const teamFilter=value('--team');
 if(teamFilter)id(teamFilter,'--team');
 const catalog=structuredClone(currentCatalog);
 let changed=0,matched=0;
 for(const game of catalog.games)for(let i=0;i<game.teams.length;i++){
  const card=game.teams[i];
  if(teamFilter&&teamFilter!==card.id)continue;
  matched++;
  const path='data/rotations/'+game.id+'/'+card.id+'.json';
  if(!existsSync(resolve(root,path)))die('Missing book '+path);
  const book=read(path);
  assert(book.game===game.id&&book.id===card.id,'Book/catalog IDs mismatch '+path);
  const next=derivedFromBook(book,card);
  if(!stable(card,next)){game.teams[i]=next;changed++}
 }
 if(teamFilter&&!matched)die('Unknown team '+teamFilter);
 if(!changed){console.log('Catalog is synchronized; no changes.');return}
 projectValidate(null,catalog);
 if(check)die('Catalog drift detected for '+changed+' team(s). Run npm run catalog:sync -- --write');
 if(!write){console.log('DRY RUN: '+changed+' catalog team(s) need derived fields synchronized; pass --write');return}
 saveCatalog(catalog);
 console.log('SYNCHRONIZED '+changed+' catalog team(s); book IDs, variants and stages were not modified');
}
try{
 if(mode==='add')addTeam(value('--spec'));
 else if(mode==='sync')syncCatalog();
 else die('Usage: add --spec <file> [--write] | sync [--team id] [--check|--write]');
}catch(err){console.error('team-authoring: '+err.message);process.exitCode=1}
