import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),load=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const errors=[];
const manifest=load('data/portraits/wuthering-waves.json');
if(manifest.schemaVersion!==1||manifest.game!=='wuthering-waves'||!Array.isArray(manifest.characters)||!manifest.characters.length)errors.push('bad registry structure');
const names=new Set(),ids=new Set(),paths=new Set(),byId=new Map();
for(const c of manifest.characters||[]){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.id))errors.push('bad slug '+c.id);
 if(ids.has(c.id))errors.push('duplicate id '+c.id);
 if(names.has(c.name))errors.push('duplicate name '+c.name);
 if(paths.has(c.portrait))errors.push('duplicate portrait path '+c.portrait);
 ids.add(c.id);names.add(c.name);paths.add(c.portrait);byId.set(c.id,c);
 if(!c.name||!c.element||![4,5].includes(c.rarity))errors.push('bad metadata '+c.id);
 if(c.portrait!=='portraits/wuthering-waves/'+c.id+'.webp')errors.push('noncanonical portrait path '+c.id);
 if(c.sourcePage!=='https://www.prydwen.gg/wuthering-waves/characters/'+c.id)errors.push('source page mismatch '+c.id);
 if(!/^https:\/\/cdn\.prydwen\.gg\/images\/(ww|wuthering-waves)\/characters\/[^/]+\.webp$/.test(c.sourceImage))errors.push('unexpected source image URL '+c.id);
 if(!/^[a-f0-9]{12}$/.test(c.sourceSha256Prefix))errors.push('bad source hash '+c.id);
 const file=resolve(root,'public',c.portrait);
 if(!existsSync(file)){errors.push('missing local portrait '+file);continue}
 const bytes=readFileSync(file);
 if(bytes.length>100000||bytes.length<300||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')errors.push('invalid local webp '+c.id);
}
for(const [alias,id] of Object.entries(manifest.aliases||{})){
 if(!byId.has(id))errors.push('alias refers to unknown id '+alias+' -> '+id);
 if(alias!==alias.toLowerCase()||!alias.trim())errors.push('invalid alias '+alias);
}
const catalog=load('data/catalog.json');
const game=catalog.games.find(g=>g.id===manifest.game);
if(!game)errors.push('missing game in catalog');
for(const team of game?.teams||[]){
 const book=load('data/rotations/wuthering-waves/'+team.id+'.json');
 for(const ch of book.characters){
  const portraitId=manifest.aliases?.[ch.id]||ch.id;
  const expected=byId.get(portraitId);
  if(!expected){errors.push('WuWa character has no registry ID/alias: '+ch.id);continue}
  if(ch.portrait!==expected.portrait)errors.push('rotation portrait mismatch '+team.id+'/'+ch.id+' (expected '+expected.portrait+')');
 }
}
console.log('Checked WuWa portrait metadata and linked teams; validating Endfield PNGs next.');
console.log('Validated '+ids.size+' named WuWa portraits, '+new Set(manifest.characters.map(x=>x.sourceImage)).size+' original source images and linked team portraits');

/* EndfieldTools.DEV English MHT: preserve original PNG bytes, not cropped fan art.
   Validate *all* 34 pinned icon ID/image bindings by file hash and dimensions. */
const endfield=load('data/portraits/arknights-endfield.json');
const endfieldGame='arknights-endfield';
if(endfield.schemaVersion!==1||endfield.game!==endfieldGame||endfield.characters?.length!==35)errors.push('Endfield: expected 34 MHT icons plus one SHA-pinned Argent Flow source icon');
const endNames=new Set(),endIds=new Set(),endPaths=new Set(),endPageIds=new Set();
const endMap=new Map();
for(const icon of endfield.characters||[]){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(icon.id))errors.push('Endfield: invalid character ID '+icon.id);
 if(endIds.has(icon.id)||endPaths.has(icon.portrait)||endNames.has(icon.name))errors.push('Endfield: duplicate ID/portrait/name '+icon.id);
 endIds.add(icon.id);endPaths.add(icon.portrait);endNames.add(icon.name);endMap.set(icon.id,icon);
 if(icon.portrait!=='portraits/arknights-endfield/'+icon.id+'.png')errors.push('Endfield: portrait filename mismatches operator '+icon.id);
 const expectedPageId=icon.id.startsWith('endministrator-')?'endministrator':icon.id;
 if(icon.id==='argent-flow'){
  if(icon.sourcePage!=="https://github.com/Dr-hydra/Better-Endfield/blob/main/native/modules/combat_stats/assets/avatars/chr_0037_minghe.png"||icon.sourceImage!=="https://raw.githubusercontent.com/Dr-hydra/Better-Endfield/main/native/modules/combat_stats/assets/avatars/chr_0037_minghe.png")errors.push('Endfield: Argent Flow source mismatch');
  if(icon.sourceBlobSha1!=='0ba7af3d6daf5ace05e080ed2566714323fb67f4'||icon.sha256!=="564388e76ee301ba6835602620fdb87127ae0518e6db0b196cf0a41089ceee82")errors.push('Endfield: Argent Flow source SHA mismatch');
  if(icon.width!==112||icon.height!==112)errors.push('Endfield: Argent Flow source PNG dimensions differ');
 }else{
  if(icon.sourcePage!=='https://endfieldtools.dev/characters/'+expectedPageId+'/')errors.push('Endfield: wrong operator source page '+icon.id);
   if(icon.width!==150||icon.height<200||icon.height>210)errors.push('Endfield: unexpected MHT PNG dimensions '+icon.id);
 }
 endPageIds.add(expectedPageId);
 if(!/^https:\/\/endfieldtools\.dev\/assets\/images\/endfield\/charicon\/icon_chr_[a-zA-Z0-9_]+\.png$/.test(icon.sourceImage))errors.push('Endfield: unexpected charicon source '+icon.id);
 if(!/^[a-f0-9]{64}$/.test(icon.sha256))errors.push('Endfield: incomplete SHA-256 '+icon.id);
 const file=resolve(root,'public',icon.portrait);
 if(!existsSync(file)){errors.push('Endfield: missing PNG '+file);continue}
 const bytes=readFileSync(file),actual=createHash('sha256').update(bytes).digest('hex');
 if(bytes.length<300||bytes.length>200000||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||bytes.toString('ascii',12,16)!=='IHDR')errors.push('Endfield: invalid PNG '+icon.id);
 else if(bytes.readUInt32BE(16)!==icon.width||bytes.readUInt32BE(20)!==icon.height)errors.push('Endfield: dimensions changed '+icon.id);
 if(actual!==icon.sha256)errors.push('Endfield: SHA-256 mismatch for '+icon.id+' — image differs from MHT');
}
if(endIds.size!==35||endPageIds.size!==34)errors.push('Endfield: missing or duplicated operator variants');
for(const [alias,target] of Object.entries(endfield.aliases||{})){
 if(!endMap.has(target))errors.push('Endfield: invalid alias '+alias+' -> '+target);
 if(alias==='endministrator')errors.push('Endfield: ambiguous Endministrator gender must not silently resolve');
}
const endCatalogGame=catalog.games.find(g=>g.id===endfieldGame);
if(!endCatalogGame)errors.push('Endfield: no game entry in catalog');
for(const team of endCatalogGame?.teams||[]){
 const book=load('data/rotations/'+endfieldGame+'/'+team.id+'.json');
 for(const character of book.characters){
  const canonicalId=endfield.aliases?.[character.id]??character.id;
  const canonical=endMap.get(canonicalId);
  if(!canonical)errors.push('Endfield: unknown operator ID '+character.id+' in '+team.id);
  else if(character.portrait!==canonical.portrait)errors.push('Endfield: mismatched portrait '+team.id+'/'+character.id);
 }
}
// Additional derived Endfield mini-registry check: exact byte-for-byte regeneration
// from the SHA-pinned original source PNGs, without modifying the working tree.
if(!errors.length){
 try{execFileSync(process.execPath,['scripts/generate-endfield-minis.mjs','--check'],{stdio:'inherit'});}
 catch(error){errors.push('Endfield mini PNG verification failed: '+error.message)}
}
// Stage 01 Arts icon registry: validate all 20 original status sprites offline.
if(!errors.length){
 try{execFileSync(process.execPath,['scripts/validate-endfield-arts.mjs'],{stdio:'inherit'});}
 catch(error){errors.push('Endfield Arts icon validation failed: '+error.message)}
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Validated '+endIds.size+' original Endfield icon PNGs, '+endPageIds.size+' operator pages and the canonical character/portrait bindings.');
