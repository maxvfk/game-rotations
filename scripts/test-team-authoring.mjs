import {cpSync,mkdtempSync,readFileSync,writeFileSync,existsSync,rmSync,renameSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root=process.cwd(),temp=mkdtempSync(join(tmpdir(),'team-authoring-test-'));
const cli=resolve(root,'scripts/team-authoring.mjs'),load=p=>JSON.parse(readFileSync(join(temp,p),'utf8'));
const put=(p,v)=>writeFileSync(join(temp,p),JSON.stringify(v,null,2)+'\n');
const digest=p=>createHash('sha256').update(readFileSync(join(temp,p))).digest('hex');
const bookPath='data/rotations/wuthering-waves/fixture-hsin-suoming.json';
const catPath='data/catalog.json';
let successes=0;
function run(args,shouldPass=true){
 const r=spawnSync(process.execPath,[cli,...args],{cwd:temp,encoding:'utf8',timeout:40000});
 if((r.status===0)!==shouldPass)throw new Error(args.join(' ')+'\nExpected '+(shouldPass?'success':'failure')+'; got '+r.status+'\n'+r.stdout+'\n'+r.stderr);
 successes++;
 return (r.stdout||'')+(r.stderr||'');
}
try{
 cpSync(resolve(root,'data'),join(temp,'data'),{recursive:true});
 cpSync(resolve(root,'public/portraits'),join(temp,'public/portraits'),{recursive:true});
 mkdirSync(join(temp,'examples'),{recursive:true});
 const original=readFileSync(resolve(root,'examples/new-team.authoring.json'),'utf8');
 writeFileSync(join(temp,'examples/new-team.authoring.json'),original);
 const specPath='examples/new-team.authoring.json';
 const originalCatalog=digest(catPath);
 // Fictional template is safe for preview and is refused in publish mode.
 run(['add','--spec',specPath]);
 if(existsSync(join(temp,bookPath)))throw Error('Preview wrote book');
 if(digest(catPath)!==originalCatalog)throw Error('Preview changed catalog');
 run(['add','--spec',specPath,'--write'],false);
 if(digest(catPath)!==originalCatalog)throw Error('Rejected placeholder changed catalog');
 console.log('✓ preview is read-only, incomplete placeholder spec cannot be published');
 let spec=JSON.parse(original.replaceAll('TEST','Fixture').replaceAll('FICTIONAL','Fixture'));
 spec.id='fixture-hsin-suoming';
 spec.title='Hsin / Suoming training fixture';
 spec.gameVersion='Global live 3.7 (fixture snapshot)';
 spec.source='https://github.com/maxvfk/Games/blob/main/guides/wuthering-waves/HSIN_SUOMING_SHOREKEEPER_ROTATIONS.md';
 spec.evidence.userSelection='Fixture selected only inside an isolated temporary directory';
 put(specPath,spec);
 run(['add','--spec',specPath]);
 if(digest(catPath)!==originalCatalog||existsSync(join(temp,bookPath)))throw Error('Validated dry run wrote data');
 console.log('✓ filled spec validates without publishing');
 run(['add','--spec',specPath,'--write']);
 const book=load(bookPath),catalog=load(catPath),game=catalog.games.find(g=>g.id==='wuthering-waves');
 const card=game.teams.find(t=>t.id===spec.id);
 if(!card||book.id!==spec.id||book.game!==spec.game)throw Error('Missing generated team');
 if(card.characters.some(c=>!c.portrait.startsWith('portraits/wuthering-waves/')))throw Error('Not using portrait registry');
 if(book.characters[0].portrait!=='portraits/wuthering-waves/hsin.webp'||book.characters[1].portrait!=='portraits/wuthering-waves/suoming.webp')throw Error('Portrait identity mismatch');
 if(JSON.stringify(Object.keys(book.stages))!==JSON.stringify(Object.keys(spec.stages)))throw Error('Stage IDs changed');
 if(JSON.stringify(book.variants[0].opener)!==JSON.stringify(spec.variants[0].opener))throw Error('Opener IDs changed');
 const originalGenerated=digest(bookPath),newCatalog=digest(catPath);
 run(['add','--spec',specPath,'--write']);
 if(digest(bookPath)!==originalGenerated||digest(catPath)!==newCatalog)throw Error('Second write was not idempotent');
 console.log('✓ generated valid book+catalog, portraits and unchanged stage IDs; repeated write is a no-op');
 const changed={...spec,characters:spec.characters.map(x=>({...x,investment:'S9R9'}))};
 put(specPath,changed);
 run(['add','--spec',specPath,'--write'],false);
 if(digest(bookPath)!==originalGenerated||digest(catPath)!==newCatalog)throw Error('Collision overwrote existing team');
 console.log('✓ conflicting existing team remains unchanged');
 // Book is canonical; sync repairs only mirrored fields, not stage IDs / UI metadata.
 const bookEdited=load(bookPath), oldStageIds=Object.keys(bookEdited.stages);
 bookEdited.characters[0].investment='S9R9';
 bookEdited.gameVersion='Global live fixture update';
 put(bookPath,bookEdited);
 const editedBookDigest=digest(bookPath),beforeSync=digest(catPath);
 run(['sync','--team',spec.id,'--check'],false);
 run(['sync','--team',spec.id]);
 if(digest(catPath)!==beforeSync)throw Error('Sync preview mutated catalog');
 run(['sync','--team',spec.id,'--write']);
 const after=load(catPath).games.find(g=>g.id==='wuthering-waves').teams.find(t=>t.id===spec.id);
 if(after.characters[0].investment!=='S9R9'||after.gameVersion!==bookEdited.gameVersion)throw Error('Book-derived fields not synced');
 if(after.status!==card.status||after.subtitle!==card.subtitle)throw Error('Authored UI metadata overwritten');
 if(digest(bookPath)!==editedBookDigest||JSON.stringify(Object.keys(load(bookPath).stages))!==JSON.stringify(oldStageIds))throw Error('Sync modified book');
 run(['sync','--check']);
 const syncHash=digest(catPath);run(['sync','--write']);if(digest(catPath)!==syncHash)throw Error('Repeated sync changed catalog');
 console.log('✓ catalog synchronization is safe, idempotent, and preserves editorial fields and book stages');
 let bad=JSON.parse(original.replaceAll('TEST','Fixture').replaceAll('FICTIONAL','Fixture'));
 bad.id='fixture-wrong-portrait';bad.source=spec.source;bad.characters[0].portraitId='shorekeeper';
 // Should resolve an explicitly requested *different* portrait ID, so this is valid by design:
 run(['add','--spec',specPath,'--write'],false); // existing differing team still protected
 const another=structuredClone(spec);
 another.id='fixture-unknown-character';
 another.characters[0].portraitId='not-a-real-character';
 put(specPath,another);
 run(['add','--spec',specPath,'--write'],false);
 console.log('✓ unknown canonical portrait rejected');
 // Original team and original YYXL/Hsin books in the temporary checkout must be byte-identical.
 for(const id of ['yyxl-suisui-chisa','hsin-suoming-shorekeeper']){
  const p='data/rotations/wuthering-waves/'+id+'.json';
  if(digest(p)!==createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex'))throw Error('Touched original '+id);
 }
 console.log('All '+successes+' authoring CLI checks passed; nothing was written to the real checkout.');
}finally{rmSync(temp,{recursive:true,force:true})}
