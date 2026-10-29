import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
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
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Validated '+ids.size+' named WuWa portraits, '+new Set(manifest.characters.map(x=>x.sourceImage)).size+' original source images and linked team portraits');
