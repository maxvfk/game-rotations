// ONE-TIME import of original compact EndfieldTools.DEV PNGs.
// Requires exact SHA-256 and PNG dimensions from the user-supplied English MHT.
// Fail closed: do not write ANY new assets until ALL 34 remote sources validate.
import {readFileSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';

const manifest=JSON.parse(readFileSync('data/portraits/arknights-endfield.json','utf8'));
if(manifest.schemaVersion!==1||manifest.game!=='arknights-endfield'||manifest.characters?.length!==34)throw Error('Unexpected snapshot');
const unique=new Set(manifest.characters.map(c=>c.id));
if(unique.size!==34)throw Error('Duplicate character IDs');
const obtained=new Map();
const failures=[];
const max=6;
async function worker(offset){
 for(let i=offset;i<manifest.characters.length;i+=max){
  const entry=manifest.characters[i];
  try{
   const url=new URL(entry.sourceImage);
   if(url.protocol!=='https:'||url.hostname!=='endfieldtools.dev'||!/^\/assets\/images\/endfield\/charicon\/icon_chr_[a-zA-Z0-9_]+\.png$/.test(url.pathname)||url.search||url.hash)throw Error('Unapproved image URL');
   if(!/^[a-f0-9]{64}$/.test(entry.sha256))throw Error('Bad pinned SHA-256');
   if(entry.portrait!=='portraits/arknights-endfield/'+entry.id+'.png')throw Error('Noncanonical target');
   const response=await fetch(url.toString(),{signal:AbortSignal.timeout(20000),headers:{'Accept':'image/png,image/*;q=0.8','User-Agent':'Mozilla/5.0 (GameRotationsOriginalIconImporter/1.0)'}});
   if(!response.ok)throw Error('HTTP '+response.status);
   const bytes=Buffer.from(await response.arrayBuffer());
   if(bytes.length<300||bytes.length>200000||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||bytes.toString('ascii',12,16)!=='IHDR')throw Error('Not a normal PNG');
   const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
   if(width!==entry.width||height!==entry.height)throw Error('Dimensions mismatch '+width+'x'+height);
   const sha=createHash('sha256').update(bytes).digest('hex');
   if(sha!==entry.sha256)throw Error('Source changed: '+sha+' expected '+entry.sha256);
   obtained.set(entry.id,bytes);console.log('Validated '+entry.id+' '+bytes.length+' bytes');
  }catch(error){failures.push(entry.id+': '+String(error))}
 }
}
await Promise.all(Array.from({length:max},(_,i)=>worker(i)));
if(failures.length){console.error(failures.join('\n'));throw Error('Import stopped; '+failures.length+' failed source validations. Use local MHT ZIP as fallback; do not substitute wrong images.')}
for(const entry of manifest.characters){
 const p=resolve('public',entry.portrait);
 if(existsSync(p)){
  const old=createHash('sha256').update(readFileSync(p)).digest('hex');
  if(old!==entry.sha256)throw Error('Conflicting existing portrait '+p);
 }
}
for(const entry of manifest.characters){
 const p=resolve('public',entry.portrait);
 mkdirSync(dirname(p),{recursive:true});writeFileSync(p,obtained.get(entry.id));
}
console.log('IMPORTED '+obtained.size+' exact PNG assets; no crop, no CDN dependencies in normal builds.');
