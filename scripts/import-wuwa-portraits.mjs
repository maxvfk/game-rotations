// One-time migration from the exact saved MHT URL/sha prefix manifest.
// This file must only fetch the pinned Prydwen CDN card URLs. No scraping or guesses.
// After successful import, local files are canonical. Normal application builds NEVER call the CDN.
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import sharp from 'sharp';

const registry=JSON.parse(readFileSync('data/portraits/wuthering-waves.json','utf8'));
const results=new Map(),errors=[];
const cards=registry.characters;
if(cards.length!==61||new Set(cards.map(x=>x.id)).size!==61)throw Error('Expected 61 unique character IDs');
const sources=new Map(cards.map(c=>[c.sourceImage,c.sourceSha256Prefix]));
const bufferByUrl=new Map();
const entries=[...sources];
const workers=Array.from({length:6},(_,i)=>async()=>{
 for(let j=i;j<entries.length;j+=6){
  const [url,hash]=entries[j];
  try{
   const parsed=new URL(url);
   if(parsed.protocol!=='https:'||parsed.hostname!=='cdn.prydwen.gg'||!/^\/images\/(ww|wuthering-waves)\/characters\/[^/?]+\.webp$/.test(parsed.pathname))throw Error('Blocked source URL '+url);
   const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; game-rotations-portrait-archive/1.0)','Accept':'image/webp,image/*;q=0.8,*/*;q=0.5','Referer':'https://www.prydwen.gg/'}});
   if(!response.ok)throw Error('HTTP '+response.status);
   const bytes=Buffer.from(await response.arrayBuffer());
   if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw Error('Not a WebP file');
   const actual=createHash('sha256').update(bytes).digest('hex');
   if(!actual.startsWith(hash))throw Error('Checksum mismatch, source changed since MHT snapshot '+actual.slice(0,12)+' expected '+hash);
   const metadata=await sharp(bytes).metadata();
   if(metadata.width!==374||metadata.height!==512)throw Error('Source dimensions changed '+metadata.width+'x'+metadata.height);
   bufferByUrl.set(url,bytes);console.log('OK',j+1+'/'+entries.length,url.split('/').at(-1));
  }catch(e){errors.push(url+': '+String(e))}
 }
});
await Promise.all(workers.map(w=>w()));
if(errors.length){for(const e of errors)console.error(e);throw Error('Import aborted: '+errors.length+' failed images; no files written. Use user-supplied offline ZIP instead.')}
for(const c of cards){
 const source=bufferByUrl.get(c.sourceImage);
 const thumb=await sharp(source).extract({left:0,top:50,width:374,height:374}).flatten({background:'#1a1d29'}).resize(160,160).webp({quality:82,effort:5}).toBuffer();
 const filename=resolve('public',c.portrait);
 mkdirSync(dirname(filename),{recursive:true});writeFileSync(filename,thumb);
 results.set(c.id,thumb.length);
}
console.log('Created '+results.size+' local, named, validated thumbnails ('+[...results.values()].reduce((a,b)=>a+b,0)+' bytes)');
