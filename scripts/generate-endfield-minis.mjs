// Deterministic 48×48 PNG mini portraits from canonical Endfield original RGBA PNGs.
// No external HTTP dependencies or image-processing packages are required.
// Usage: node scripts/generate-endfield-minis.mjs --write
//        node scripts/generate-endfield-minis.mjs --check (CI/default)
import {readFileSync, existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {inflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';

const root=process.cwd();
const readJson=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const manifest=readJson('data/portraits/arknights-endfield-mini.json');
const originals=readJson('data/portraits/arknights-endfield.json');
const write=process.argv.includes('--write');
if(manifest.schemaVersion!==1 || manifest.game!=='arknights-endfield' ||
   manifest.sourceManifest!=='data/portraits/arknights-endfield.json' ||
   manifest.imageSize!==48 || manifest.displaySize!==24 ||
   manifest.characters?.length!==4)throw new Error('Unexpected starter mini registry metadata');
if(write && process.argv.includes('--check'))throw new Error('Use exactly one of --check/--write');

const sha256=b=>createHash('sha256').update(b).digest('hex');
function crc32(buffer){
 let crc=0xffffffff;
 for(const b of buffer){
  crc^=b;
  for(let k=0;k<8;k++)crc=crc&1?(crc>>>1)^0xedb88320:crc>>>1;
 }
 return (crc^0xffffffff)>>>0;
}
function chunk(tag,data){
 const t=Buffer.from(tag,'ascii'),out=Buffer.allocUnsafe(12+data.length);
 out.writeUInt32BE(data.length,0);t.copy(out,4);data.copy(out,8);
 out.writeUInt32BE(crc32(out.subarray(4,8+data.length)),8+data.length);
 return out;
}
function pngDecode(original){
 const sig=Buffer.from([137,80,78,71,13,10,26,10]);
 if(!original.subarray(0,8).equals(sig))throw new Error('Not a PNG');
 let p=8,width=0,height=0,depth=0,type=0,parts=[];
 while(p<original.length){
  const length=original.readUInt32BE(p),tag=original.toString('ascii',p+4,p+8);
  p+=8;
  if(tag==='IHDR'){
   width=original.readUInt32BE(p);height=original.readUInt32BE(p+4);
   depth=original[p+8];type=original[p+9];
   if(original[p+12]!==0)throw new Error('Interlaced source unsupported');
  }
  if(tag==='IDAT')parts.push(original.subarray(p,p+length));
  p+=length+4;
  if(tag==='IEND')break;
 }
 if(depth!==8||type!==6)throw new Error('Expected 8-bit RGBA original PNG');
 const inflated=inflateSync(Buffer.concat(parts)),stride=width*4;
 const data=Buffer.alloc(height*stride);
 let off=0;
 for(let y=0;y<height;y++){
  const filter=inflated[off++],base=y*stride;
  for(let x=0;x<stride;x++){
   const raw=inflated[off++];
   const a=x>=4?data[base+x-4]:0;
   const b=y?data[base-stride+x]:0;
   const c=y&&x>=4?data[base-stride+x-4]:0;
   let predictor=0;
   if(filter===1)predictor=a;
   else if(filter===2)predictor=b;
   else if(filter===3)predictor=(a+b)>>>1;
   else if(filter===4){
    const guess=a+b-c,pa=Math.abs(guess-a),pb=Math.abs(guess-b),pc=Math.abs(guess-c);
    predictor=pa<=pb&&pa<=pc?a:pb<=pc?b:c;
   }else if(filter!==0)throw new Error('Unknown PNG filter '+filter);
   data[base+x]=(raw+predictor)&255;
  }
 }
 if(off!==inflated.length)throw new Error('Decompressed PNG size mismatch');
 return {width,height,data};
}
function crop48(image,x0,y0){
 const pixels=image.data,out=Buffer.alloc(48*48*4);
 if(x0<0||y0<0||x0+96>image.width||y0+96>image.height)throw new Error('Crop out of bounds');
 for(let y=0;y<48;y++)for(let x=0;x<48;x++){
  const at=(y*48+x)*4;let aSum=0,rs=0,gs=0,bs=0;
  for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
   const j=((y0+y*2+dy)*image.width+(x0+x*2+dx))*4;
   const a=pixels[j+3];aSum+=a;rs+=pixels[j]*a;gs+=pixels[j+1]*a;bs+=pixels[j+2]*a;
  }
  out[at+3]=Math.floor((aSum+2)/4);
  if(aSum){
   out[at]=Math.floor((rs+aSum/2)/aSum);
   out[at+1]=Math.floor((gs+aSum/2)/aSum);
   out[at+2]=Math.floor((bs+aSum/2)/aSum);
  }
 }
 return out;
}
function png48(rgba){
 const width=48,height=48,stride=width*4;
 const raw=Buffer.alloc(height*(stride+1));
 for(let y=0;y<height;y++)rgba.copy(raw,y*(stride+1)+1,y*stride,(y+1)*stride);
 const pieces=[Buffer.from([0x78,0x01])];
 let offset=0;
 while(offset<raw.length){
  const size=Math.min(65535,raw.length-offset),last=offset+size===raw.length;
  const hdr=Buffer.from([last?1:0,size&255,(size>>>8)&255,(~size)&255,((~size)>>>8)&255]);
  pieces.push(hdr,raw.subarray(offset,offset+size));offset+=size;
 }
 let a=1,b=0;
 for(const c of raw){a=(a+c)%65521;b=(b+a)%65521}
 const adler=Buffer.alloc(4);adler.writeUInt32BE(((b<<16)|a)>>>0);
 pieces.push(adler);
 const head=Buffer.alloc(13);
 head.writeUInt32BE(width,0);head.writeUInt32BE(height,4);head[8]=8;head[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
  chunk('IHDR',head),chunk('IDAT',Buffer.concat(pieces)),chunk('IEND',Buffer.alloc(0))]);
}

const existing=new Map(originals.characters.map(c=>[c.id,c]));
const seen=new Set();
for(const row of manifest.characters){
 if(seen.has(row.id))throw new Error('Duplicate mini ID '+row.id);seen.add(row.id);
 const original=existing.get(row.id);
 if(!original)throw new Error('Missing original portrait '+row.id);
 if(row.sourcePortrait!==original.portrait)throw new Error('Source manifest mismatch '+row.id);
 if(row.miniPortrait!=='portraits/arknights-endfield-mini/'+row.id+'.png')throw new Error('Unexpected mini path '+row.id);
 if(row.crop.width!==96||row.crop.height!==96)throw new Error('Only 96×96 crops supported');
 const input=readFileSync(resolve(root,'public',row.sourcePortrait));
 if(sha256(input)!==original.sha256)throw new Error('Canonical original SHA256 mismatch '+row.id);
 const output=png48(crop48(pngDecode(input),row.crop.x,row.crop.y));
 const hash=sha256(output);
 if(row.sha256!==hash)throw new Error('Mini SHA256 mismatch '+row.id+' expected '+row.sha256+' actual '+hash);
 const target=resolve(root,'public',row.miniPortrait);
 if(write){mkdirSync(dirname(target),{recursive:true});writeFileSync(target,output)}
 else if(!existsSync(target)||!readFileSync(target).equals(output))throw new Error('Mini missing or differs from deterministic generation: '+row.id);
 console.log((write?'Generated ':'Verified ')+row.id+' 48×48 SHA256 '+hash);
}
console.log('Validated '+seen.size+' Endfield mini portrait assets.');
