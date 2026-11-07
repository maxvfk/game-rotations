// Source-pinned Endfield Physical Status assets. Original "png" damage text
// sources contain WebP data; the published file extension correctly reflects it.
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd(),manifest=JSON.parse(readFileSync(resolve(root,'data/physical/arknights-endfield.json'),'utf8'));
const errors=[],paths=new Set(),digests=new Set();
const sha256=b=>createHash('sha256').update(b).digest('hex');
const blobSha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const repo='SlowMoSlothy/Arknights-Endfield-Rotation-Tool',commit='2eb9b304cdd2dc9e639d38861eaa7987f762db62';
const expected={
 lift:{name:'icon_damagetxt_airborne.png',behavior:'builder',width:44,height:44},
 'knock-down':{name:'icon_damagetxt_knockdown.png',behavior:'builder',width:44,height:44},
 crush:{name:'icon_damagetxt_crush.png',behavior:'consumer',width:36,height:40},
 breach:{name:'icon_damagetxt_fracture.png',behavior:'consumer',width:36,height:48},
};
function verify(icon,path,source,width,height,format){
 if(!icon||icon.path!==path||icon.sourcePath!==source||icon.width!==width||icon.height!==height){errors.push('Wrong manifest spec for '+path);return;}
 if(!/^[a-f0-9]{64}$/.test(icon.sha256)||!/^[a-f0-9]{40}$/.test(icon.sourceBlobSha)||paths.has(path)||digests.has(icon.sha256)){
  errors.push('Bad or duplicate hash/path '+path);return;
 }
 paths.add(path);digests.add(icon.sha256);
 const full=resolve(root,'public',path);
 if(!existsSync(full)){errors.push('Missing sprite '+path);return;}
 const b=readFileSync(full);
 if(b.length<300||b.length>50000){errors.push('Unexpected file size '+path);return;}
 if(format==='png'){
  if(!b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||
   b.readUInt32BE(16)!==width||b.readUInt32BE(20)!==height||b[24]!==8||b[25]!==6)
   errors.push('Incorrect original PNG format/dimensions '+path);
 }else{
  if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP'||b.toString('ascii',12,16)!=='VP8X'||
    b.readUIntLE(24,3)+1!==width||b.readUIntLE(27,3)+1!==height)
    errors.push('Incorrect WebP bytes/MIME/dimensions '+path);
 }
 if(sha256(b)!==icon.sha256||blobSha(b)!==icon.sourceBlobSha)errors.push('Source asset hash mismatch '+path);
}
if(manifest.schemaVersion!==1||manifest.game!=='arknights-endfield'||manifest.source?.repository!==repo||manifest.source?.commit!==commit)
 errors.push('Physical registry header/source mismatch');
if(manifest.vulnerability?.id!=='vulnerability'||manifest.vulnerability?.maxStacks!==4||
 manifest.vulnerability?.artworks?.length!==4)errors.push('Expected four Vulnerability sprites');
for(const n of [1,2,3,4]){
 const rows=manifest.vulnerability?.artworks?.filter(x=>x.stacks===n)||[];
 if(rows.length!==1){errors.push('Wrong stack '+n);continue;}
 verify(rows[0],'physical/arknights-endfield/vulnerability/vulnerable-'+n+'.png',
  'endfield/assets/ui/debuffs/vulnerable_'+n+'.png',125,125,'png');
}
if(JSON.stringify(Object.keys(manifest.effects||{}).sort())!==JSON.stringify(Object.keys(expected).sort()))
 errors.push('Physical effects must be exactly Lift, Knock Down, Crush, Breach');
for(const [id,item] of Object.entries(expected)){
 const spec=manifest.effects?.[id];
 if(spec?.id!==id||spec?.kind!=='physical-effect'||spec?.behavior!==item.behavior)
  errors.push('Wrong Physical behavior '+id);
 verify(spec?.icon,'physical/arknights-endfield/effects/'+id+'.webp',
  'endfield/assets/ui/effects/'+item.name,item.width,item.height,'webp');
 if(spec?.icon?.format!=='image/webp')errors.push('MIME must match bytes '+id);
}
if(paths.size!==8||digests.size!==8)errors.push('Exactly 8 pinned physical sprites required');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Validated 4 original Vulnerability PNG stack rings and 4 Physical Status WebP glyphs (SHA-1 + SHA-256).');
