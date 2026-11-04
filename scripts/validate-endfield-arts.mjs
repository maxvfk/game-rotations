// Validate 20 source-pinned Endfield Arts icon PNGs. No network access required.
// Dedicated original game assets are mirrored verbatim, not edited or synthesized.
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

const root=process.cwd();
const manifest=JSON.parse(readFileSync(resolve(root,'data/arts/arknights-endfield.json'),'utf8'));
const elements=['heat','electric','cryo','nature'];
const reactions={combustion:'heat',electrification:'electric',solidification:'cryo',corrosion:'nature'};
const expectedRepo='SlowMoSlothy/Arknights-Endfield-Rotation-Tool';
const expectedCommit='2eb9b304cdd2dc9e639d38861eaa7987f762db62';
const errors=[],paths=new Set(),hashes=new Set();
const rootSource='endfield/assets/ui/debuffs/';
const hex64=/^[a-f0-9]{64}$/;
const hex40=/^[a-f0-9]{40}$/;
const sha256=buf=>createHash('sha256').update(buf).digest('hex');
const blobSha1=buf=>createHash('sha1')
  .update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');

function validateAsset(spec,expectedPath,expectedSource,expectedWidth,expectedHeight=expectedWidth){
 if(!spec||typeof spec!=='object'){errors.push('Missing asset '+expectedPath);return;}
 if(spec.path!==expectedPath||spec.sourcePath!==expectedSource)
  errors.push('Unexpected path/source '+expectedPath);
 if(spec.width!==expectedWidth||spec.height!==expectedHeight)
  errors.push('Unexpected manifest dimensions '+expectedPath);
 if(!hex64.test(spec.sha256)||!hex40.test(spec.sourceBlobSha))
  errors.push('Missing or invalid digest '+expectedPath);
 if(paths.has(spec.path)||hashes.has(spec.sha256))
  errors.push('Duplicate asset path/hash '+expectedPath);
 paths.add(spec.path);hashes.add(spec.sha256);
 // Only canonical, enumerated paths are ever resolved. No arbitrary manifest paths.
 const file=resolve(root,'public',expectedPath);
 if(!existsSync(file)){errors.push('Missing PNG '+expectedPath);return;}
 const bytes=readFileSync(file);
 const sig=Buffer.from([137,80,78,71,13,10,26,10]);
 if(bytes.length<500||bytes.length>50000||!bytes.subarray(0,8).equals(sig)||bytes.toString('ascii',12,16)!=='IHDR')
  {errors.push('Invalid PNG '+expectedPath);return;}
 if(bytes.readUInt32BE(16)!==expectedWidth||bytes.readUInt32BE(20)!==expectedHeight||bytes[24]!==8||bytes[25]!==6||bytes[28]!==0)
  errors.push('Original PNG format changed '+expectedPath);
 if(sha256(bytes)!==spec.sha256)errors.push('SHA256 mismatch '+expectedPath);
 if(blobSha1(bytes)!==spec.sourceBlobSha)errors.push('Original source blob mismatch '+expectedPath);
}

if(manifest.schemaVersion!==1||manifest.game!=='arknights-endfield')
 errors.push('Unexpected Arts registry header');
if(manifest.source?.repository!==expectedRepo||manifest.source?.commit!==expectedCommit)
 errors.push('Unexpected source repository/commit');
if(Object.keys(manifest.inflictions||{}).sort().join('|')!==[...elements].sort().join('|'))
 errors.push('Unexpected Infliction IDs');
if(Object.keys(manifest.reactions||{}).sort().join('|')!==Object.keys(reactions).sort().join('|'))
 errors.push('Unexpected Reaction IDs');
for(const id of elements){
 const entity=manifest.inflictions?.[id];
 if(entity?.id!==id||entity?.kind!=='infliction'||entity?.maxStacks!==4||
    !Array.isArray(entity?.artworks)||entity.artworks.length!==4)
  {errors.push('Unexpected Infliction record '+id);continue;}
 for(let n=1;n<=4;n++){
  const icon=entity.artworks.find(row=>row.stacks===n);
  if(entity.artworks.filter(row=>row.stacks===n).length!==1)errors.push('Stack number duplicate/missing '+id+'/'+n);
  validateAsset(icon,'arts/arknights-endfield/inflictions/'+id+'-'+n+'.png',
   rootSource+id+'_infliction_'+n+'.png',125);
 }
}
for(const [id,element] of Object.entries(reactions)){
 const item=manifest.reactions?.[id];
 if(item?.id!==id||item?.kind!=='reaction'||item?.element!==element)
  errors.push('Unexpected Reaction record '+id);
 validateAsset(item?.icon,'arts/arknights-endfield/reactions/'+id+'.png',
  rootSource+id+'.png',id==='electrification'?73:72,72);
}
if(paths.size!==20||hashes.size!==20)errors.push('Expected 20 distinct original art assets');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('Validated 4 Endfield Arts Inflictions × 4 original stack sprites + 4 Arts Reactions = 20 PNGs.');
