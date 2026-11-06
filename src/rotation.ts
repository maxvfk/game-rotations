import './rotation.css';

import type {RotationBook, RotationStage, RotationCharacter, Action, ControlMap, Scheme, RotationVariant} from './rotation-types';
import {createArtsActionEffect} from './arts-checkpoint-view';

const BOOKS:Record<string,RotationBook> = {};
for(const raw of Object.values(import.meta.glob('../data/rotations/**/*.json',{eager:true,import:'default'}))){const book=raw as RotationBook;BOOKS[book.id]=book}
const SCHEMES:Record<string,ControlMap> = {};
for(const raw of Object.values(import.meta.glob('../data/controls/*.json',{eager:true,import:'default'}))){const config=raw as ControlMap;SCHEMES[config.game]=config}
// Derived mini portraits are kept separate from full portraits and keyed by game + actor ID.
// Assets come from local public/ paths and are precached for offline PWA use.
type MiniPortraitRegistry={game:string;characters:Array<{id:string;miniPortrait:string}>};
const MINI_PORTRAITS=new Map<string,Map<string,string>>();
for(const raw of Object.values(import.meta.glob('../data/portraits/*-mini.json',{eager:true,import:'default'}))){
 const registry=raw as MiniPortraitRegistry;
 MINI_PORTRAITS.set(registry.game,new Map(registry.characters.map(item=>[item.id,item.miniPortrait])));
}
const SHELL = "<nav class=\"catalog-back\"><a id=\"catalog-link\" href=\"../\">← Каталог игр и команд</a></nav>\n<div class=\"wrap\">\n <div class=\"topline\"><div class=\"sigil\"><div class=\"emblem\" aria-hidden=\"true\">✦</div><div><div class=\"overline\">FIELD NOTES / GAME ROTATIONS</div><div class=\"little\"><span id=\"route-version\"></span></div></div></div><button class=\"iconbtn\" id=\"info\" title=\"Справка\" aria-label=\"Справка\">ⓘ</button></div>\n <header><h1>Боевые <em>ротации</em></h1><p class=\"hero-sub\">Выбранные ротации команды с подсказками по действиям и ресурсам.</p></header>\n <div class=\"team\" id=\"team\" aria-label=\"Состав команды\"></div>\n <p class=\"section-label\">Выбери ротацию</p><div class=\"tabs\" role=\"tablist\" aria-label=\"Вариант ротации\" id=\"tabs\"></div>\n <div class=\"meta\" id=\"meta\" aria-live=\"polite\"></div>\n <div class=\"input-controls\"><span class=\"control-caption\">ОБОЗНАЧЕНИЯ</span><div class=\"seg input-seg\" id=\"control-selector\" role=\"group\" aria-label=\"Схема управления\"></div><button class=\"slots-btn\" id=\"slots-btn\" type=\"button\" aria-expanded=\"false\" aria-controls=\"slots-panel\">Слоты: 1 / 2 / 3 · изменить</button></div><div id=\"keyhelp\" class=\"keyhelp\" aria-live=\"polite\"></div>\n <div class=\"slots-panel hidden\" id=\"slots-panel\"></div>\n <div class=\"controlbar\"><div class=\"seg\" role=\"group\" aria-label=\"Начало или повторный цикл\"><button id=\"opener\" aria-pressed=\"false\">Первый заход</button><button id=\"loop\" aria-pressed=\"true\">Повтор</button></div><div class=\"control-right\"><button class=\"mini\" id=\"view\" aria-label=\"Переключить режим просмотра\">☷ Все этапы</button><button class=\"mini\" id=\"reset\" aria-label=\"Сбросить прогресс\">↺ Сброс</button></div></div>\n <div class=\"progress-wrap\"><div class=\"progress-row\"><strong id=\"progress-label\">ПРОГРЕСС</strong><span id=\"progress-count\"></span></div><div class=\"progress-track\" role=\"progressbar\" aria-label=\"Выполненные этапы\" aria-valuemin=\"0\" aria-valuemax=\"100\" id=\"progress-track\"><div class=\"progress-fill\" id=\"progress-fill\"></div></div></div>\n <main id=\"route\" class=\"route\" aria-live=\"polite\"></main><div id=\"navigation\" class=\"foot-steps hidden\"><button class=\"nav\" id=\"prev\">← Назад</button><button class=\"nav primary\" id=\"next\">Далее →</button></div>\n <footer class=\"bottom\"><p id=\"control-summary\"></p><p><strong style=\"color:#e5e0e4\">Точность:</strong> <span id=\"route-verification\"></span></p><p class=\"control-footnote\">Иллюстрации принадлежат правообладателям соответствующих игр; изображения хранятся локально для офлайн-режима.</p><a id=\"route-source\" target=\"_blank\" rel=\"noopener noreferrer\">Открыть подробный гайд ↗</a></footer>\n</div>\n\n<div class=\"install hidden\" id=\"install\"><p>Установить библиотеку для офлайн-доступа?</p><button id=\"install-btn\">Установить</button><button id=\"install-close\" class=\"dismiss\" aria-label=\"Закрыть\">×</button></div><div class=\"toast hidden\" id=\"toast\" role=\"status\"></div>";
const node=(tag:string,cls='',value='')=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value)el.textContent=value;return el};
const saved=(prefix:string)=>(key:string,def:unknown):any=>{try{const value=localStorage.getItem(prefix+key);return value===null?def:JSON.parse(value)}catch{return def}};
const write=(prefix:string)=>(key:string,value:unknown)=>{try{localStorage.setItem(prefix+key,JSON.stringify(value))}catch{}};
type Bound = {key:string;name:string;kind?:string};
export function hasRotation(id:string){return Object.hasOwn(BOOKS,id)}
export function mountRotation(root:HTMLDivElement,id:string,backUrl:string,base:string){
 const book=BOOKS[id], controlMap=SCHEMES[book?.controls];
 if(!book||!controlMap)throw new Error('Unknown rotation or controls: '+id);
 root.classList.add('rotation-app','game-'+book.game);root.innerHTML=SHELL;
 const q=<T extends Element = HTMLElement>(selector:string)=>{const el=root.querySelector<T>(selector);if(!el)throw new Error('Missing rotation element: '+selector);return el};
 q<HTMLAnchorElement>('#catalog-link').href=backUrl;
 q('#route-version').textContent=book.gameVersion;
 q('#route-verification').textContent=book.verificationNote;
 q<HTMLAnchorElement>('#route-source').href=book.source;
 const characterById=new Map(book.characters.map(c=>[c.id,c]));
 const team=q('#team');team.replaceChildren();
 for(const [i,person] of book.characters.entries()){
  if(i)team.append(node('span','team-arrow','→'));
  const pill=node('div','team-pill');const img=document.createElement('img');
  img.src=base+person.portrait;img.className='orb portrait-orb '+person.id;img.alt='';img.loading='eager';
  const invest=node('span','',person.investment);invest.style.color='#8f91a8';
  pill.append(img,document.createTextNode(person.name+' '),invest);team.append(pill);
 }
 // Endfield rotations are repeatable quick-reference sequences, not checklists.
 const tracksProgress=book.game!=='arknights-endfield';
 if(!tracksProgress){root.querySelector('#reset')?.remove();root.querySelector('.progress-wrap')?.remove()}
 const storagePrefix=id==='yyxl-suisui-chisa'?'wuwa-r-v1:':'game-rotations:v2:'+id+':';
 const get=saved(storagePrefix),set=write(storagePrefix);
 const slotIds=Object.keys(book.defaultSlots);
 const values=Object.values(book.defaultSlots);
 let slots:Record<string,string>={...book.defaultSlots};
 const initialSlots=get('slots',book.defaultSlots) as Record<string,string>;
 if(initialSlots && slotIds.every(k=>values.includes(initialSlots[k])) && new Set(slotIds.map(k=>initialSlots[k])).size===slotIds.length)slots={...initialSlots};
 let controls=String(get('controls',controlMap.schemes[0]?.id??'terms'));
 // Full by default; one setting per team, shared by Maygi and Prydwen.
 let compact=book.game==='arknights-endfield'&&get('compact',false)===true;
 // Arts is opt-out and independent of Full/Compact, Maygi/Prydwen and controls.
 // Persist per team; legacy sessions with no key keep the current visible UI.
 let showArts=book.game==='arknights-endfield'&&get('artsVisible',true)!==false;
 if(!controlMap.schemes.some(s=>s.id===controls))controls=controlMap.schemes[0].id;
 let slotsOpen=false;
 const selector=q('#control-selector');
 for(const scheme of controlMap.schemes){
  const btn=node('button','',scheme.label) as HTMLButtonElement;btn.id='control-'+scheme.id;
  btn.setAttribute('aria-pressed',String(controls===scheme.id));
  btn.onclick=()=>{controls=scheme.id;set('controls',controls);render()};
  selector.append(btn);
 }
 // Endfield-only density control lives next to Terms/PC and does not affect WuWa.
 if(book.game==='arknights-endfield'){
  const density=node('div','density-controls');
  density.append(node('span','control-caption','ВИД'));
  const densityButtons=node('div','seg compact-seg');
  for(const [value,label] of [['full','Полный'],['compact','Компактный']] as const){
   const button=node('button','',label) as HTMLButtonElement;
   button.type='button';button.id='layout-'+value;
   button.setAttribute('aria-pressed',String(compact===(value==='compact')));
   button.onclick=()=>{compact=value==='compact';set('compact',compact);render()};
   densityButtons.append(button);
  }
  densityButtons.setAttribute('role','group');densityButtons.setAttribute('aria-label','Вид карточек действий');
  density.append(densityButtons);
   const artsToggle=node('button','arts-visibility-toggle') as HTMLButtonElement;
   artsToggle.type='button';artsToggle.id='arts-visibility-toggle';
   artsToggle.setAttribute('aria-label','Показывать Arts-индикаторы');
   artsToggle.onclick=()=>{showArts=!showArts;set('artsVisible',showArts);render()};
   density.append(artsToggle);
   selector.after(density);
 }
 const panel=q('#slots-panel');const selectByPerson=new Map<string,HTMLSelectElement>();
 for(const person of book.characters){
  const select=document.createElement('select');select.id='slot-'+person.id;select.setAttribute('aria-label','Слот '+person.name);
  for(const v of values){const option=document.createElement('option');option.value=v;option.textContent=v;select.append(option)}
  select.onchange=()=>{
   const value=select.value;const other=slotIds.find(k=>k!==person.id&&slots[k]===value);
   if(other)slots[other]=slots[person.id];slots[person.id]=value;set('slots',slots);render();
  };
  selectByPerson.set(person.id,select);const label=document.createElement('label');label.append(person.name+' ',select);panel.append(label);
 }
 const slotsExplain=node('span','slots-explain');slotsExplain.id='slot-explain';panel.append(slotsExplain);
 const currentScheme=():Scheme=>controlMap.schemes.find(s=>s.id===controls)!;
 const isDescriptive=()=>controls==='terms';
 function slotKey(personId:string){const slot=slots[personId]??values[0];return currentScheme().slotKeys[slot]||slot}
 function binding(a:Action,person:RotationCharacter):Bound{
  const x=a.text, input=a.input,k=input.kind,scheme=currentScheme();
  const actor=input.actor?characterById.get(input.actor)??person:person;
  const namePrefix=input.actor?actor.name+' · ':'';
  // "actor" is the real operator of this action, even in a mixed team phase.
  // It is NOT a swap: Endfield Combo Skills can be triggered off-field.
  if(k==='intro')return {key:isDescriptive()?'Intro':slotKey(actor.id),name:namePrefix+x};
  if(k==='outro'||k==='swap')return {key:isDescriptive()?(k==='outro'?'Outro':'Swap'):slotKey(input.target||actor.id),name:namePrefix+x};
  const controlKind=k==='final-strike'?'finalStrike':k;
  let key=scheme.keys[controlKind]||'?',name=x;
  // Endfield's 1–4 skill buttons are operator-specific. This is not a character swap.
  if(book.game==='arknights-endfield'&&!isDescriptive()&&(k==='skill'||k==='ultimate')){
   key=k==='ultimate'?'удерж. '+slotKey(actor.id):slotKey(actor.id);
  }
  if(k==='basic'&&input.repeat)key=scheme.keys.repeat||key;
  else if(k==='basic'&&input.count&&input.count>1)key+=' ×'+input.count;
  if(k==='skill'&&x.startsWith('E · '))name=x.slice(4);
  if(k==='ultimate')name=x==='R'?'Liberation':x.replace(/^R · /,'');
  if(input.press==='hold')key=(isDescriptive()?'Hold ':'удерж. ')+key;
  return {key,name:namePrefix+name,kind:k==='auto'?'auto':undefined};
 }
 const slotsBtn=q<HTMLButtonElement>('#slots-btn');
 function renderSlots(){
  slotsBtn.textContent='Слоты: '+book.characters.map(c=>slots[c.id]+' '+c.name).join(' · ');
  slotsBtn.setAttribute('aria-expanded',String(slotsOpen));
  panel.classList.toggle('hidden',!slotsOpen);
  for(const [id,select] of selectByPerson)select.value=slots[id];
 }
 slotsBtn.onclick=()=>{slotsOpen=!slotsOpen;renderSlots()};
 function renderControls(){
  for(const scheme of controlMap.schemes)q('#control-'+scheme.id).setAttribute('aria-pressed',String(controls===scheme.id));
  const h=q('#keyhelp');h.replaceChildren();
  for(const [key,meaning] of currentScheme().help){const el=node('span');el.append(node('b','',key),document.createTextNode(' '+meaning));h.append(el)}
  slotsBtn.classList.toggle('hidden',isDescriptive());if(isDescriptive())slotsOpen=false;
  slotsExplain.textContent=currentScheme().slotExplain;
  q('#control-summary').textContent=currentScheme().summary;
 }
 const loopWarning=node('div','loop-warning');
 loopWarning.setAttribute('role','note');
 loopWarning.setAttribute('aria-live','polite');
 root.querySelector('.controlbar')?.after(loopWarning);
 let mode=String(get('mode',book.variants[0].id)),opener=Boolean(get('opener',true)),focus=Boolean(get('focus',false));
 if(!book.variants.some(v=>v.id===mode))mode=book.variants[0].id;
 let at=0,done:boolean[]=[];
 const currentVariant=():RotationVariant=>book.variants.find(v=>v.id===mode)!;
 const progressKey=()=>mode+'-'+(opener?'opener':'loop');
 const stageKeys=()=>opener?currentVariant().opener:currentVariant().loop;
 function readProgress(){
  const size=stageKeys().length,prev=tracksProgress?get('done:'+progressKey(),[]) as boolean[]:[];
  done=Array.from({length:size},(_,i)=>tracksProgress&&!!prev?.[i]);
  at=Math.max(0,Math.min(Number(get('at:'+progressKey(),0))||0,size-1));
 }
 function persist(){if(tracksProgress)set('done:'+progressKey(),done);set('at:'+progressKey(),at)}
 readProgress();
 let timeout=0;function toast(message:string){
  const t=q('#toast');t.textContent=message;t.classList.remove('hidden');window.clearTimeout(timeout);
  timeout=window.setTimeout(()=>t.classList.add('hidden'),2300);
 }
 function render(){
  root.classList.toggle('compact-actions',compact);
  if(book.game==='arknights-endfield'){
   q('#layout-full').setAttribute('aria-pressed',String(!compact));
   q('#layout-compact').setAttribute('aria-pressed',String(compact));
    const artsToggle=q<HTMLButtonElement>('#arts-visibility-toggle');
    artsToggle.setAttribute('aria-pressed',String(showArts));
    artsToggle.textContent=showArts?'Arts: вкл':'Arts: выкл';
    artsToggle.title=showArts?'Скрыть Arts-индикаторы':'Показать Arts-индикаторы';
  }
  renderControls();renderSlots();
  const tabs=q('#tabs');tabs.replaceChildren();
  for(const v of book.variants){
   const b=node('button','tab') as HTMLButtonElement;b.setAttribute('role','tab');
   b.setAttribute('aria-selected',String(mode===v.id));b.tabIndex=mode===v.id?0:-1;
   b.append(node('strong','',v.label),node('small','',v.sub));b.onclick=()=>{mode=v.id;set('mode',mode);readProgress();render()};tabs.append(b);
  }
  const v=currentVariant(),meta=q('#meta');meta.replaceChildren(node('span','meta-badge'+(v.verification==='experimental'?' exp':''),v.type),node('p','',v.intro));
  const showLoopCaution=!opener&&!!v.loopCaution;
  loopWarning.classList.toggle('hidden',!showLoopCaution);
  loopWarning.textContent=showLoopCaution?'⚠ Повторный цикл: '+v.loopCaution:'';
  q('#opener').setAttribute('aria-pressed',String(opener));q('#loop').setAttribute('aria-pressed',String(!opener));
  q('#view').textContent=focus?'▦ Все этапы':'☷ По шагам';
  const ids=stageKeys();
  if(tracksProgress){
   const pct=Math.round(done.filter(Boolean).length/ids.length*100);
   q('#progress-count').textContent=done.filter(Boolean).length+' / '+ids.length+' этапов';
   q<HTMLElement>('#progress-fill').style.width=pct+'%';q('#progress-track').setAttribute('aria-valuenow',String(pct));
  }
  const route=q('#route');route.replaceChildren();
  for(const [i,stageId] of ids.entries()){
   if(focus && i!==at)continue;
   const s:RotationStage=book.stages[stageId],person=characterById.get(s.person)!;
   const card=node('article','stage'+(tracksProgress&&done[i]?' completed':'')+(i===at?' active':''));
   card.style.setProperty('--accent',person.color);
   const head=node('div','stage-head'),portrait=node('div','portrait');
   const face=document.createElement('img');face.src=base+person.portrait;face.alt='Портрет '+person.name;face.loading='lazy';
   face.onerror=()=>{portrait.replaceChildren(node('span','fallback',person.glyph))};portrait.append(face);
   const heading=node('div','stage-heading');heading.style.flex='1';
   const index=String(i+1).padStart(2,'0')+' / '+String(ids.length).padStart(2,'0');
   heading.append(node('div','stage-num',index+' · '+(s.actions.some(a=>a.input.actor&&a.input.actor!==s.person)?'Командная фаза':person.name)),node('div','stage-title',s.title),node('div','stage-sub',s.sub));
   if(!tracksProgress){
    // Compact titles omit author/step prefixes already represented by the stage number.
    // Unknown future title formats are kept intact, without a hard-coded TC name.
    const shortTitle=s.title.replace(/^.*?·\s*\d+[.)]\s*/u,'');
    const compactRow=node('div','stage-compact-row');
    compactRow.append(node('div','stage-compact-line',index+'  ·  '+shortTitle));
    // Compact header is an index/title only: Arts belongs to its action.
    heading.append(compactRow);
   }
   head.append(portrait,heading);
   if(tracksProgress){
    const check=node('button','complete',done[i]?'✓':'○') as HTMLButtonElement;
    check.setAttribute('aria-label',done[i]?'Отменить выполнение этапа':'Отметить этап выполненным');
    check.setAttribute('aria-pressed',String(done[i]));
    check.onclick=()=>{done[i]=!done[i];persist();render()};
    head.append(check);
   }
   card.append(head);
   const body=node('div','stage-body'),seq=node('div','sequence');
   for(const [j,a] of s.actions.entries()){
    if(j)seq.append(node('span','arr','›'));
    const b=binding(a,person),chip=node('span','action '+(a.tone==='normal'?'':a.tone)+(b.kind?' '+b.kind:'')+(controls==='ps5'?' ps5':''));
    // Endfield uses gameplay action-kind colors (not the unrelated narrative tone).
    // Keep the existing WuWa action palette completely unchanged.
    if(book.game==='arknights-endfield')chip.classList.add('endfield-action','kind-'+a.input.kind);
    chip.title=a.text;
    if(book.game==='arknights-endfield'){
     // A team stage may contain several operators; the action's actor wins over stage.person.
     const actor=a.input.actor?characterById.get(a.input.actor)??person:person;
     const mini=MINI_PORTRAITS.get(book.game)?.get(actor.id);
     const primary=node('span','action-primary');
     const img=document.createElement('img');img.className='action-portrait';
     img.alt='';img.setAttribute('aria-hidden','true');img.width=24;img.height=24;img.loading='lazy';
     // Missing registry entry uses the canonical full portrait immediately. A missing/broken
     // mini file retries that same full portrait exactly once; final failure uses a glyph.
     img.onerror=()=>{
      if(img.dataset.fallback!=='full'){
       img.dataset.fallback='full';img.src=base+actor.portrait;
      }else img.replaceWith(node('span','action-portrait-fallback',actor.glyph));
     };
     img.src=base+(mini||actor.portrait);
     primary.append(img,node('strong','keycap',b.key));
     // Keep mechanical modifiers when descriptive labels are visually hidden.
     // Explicit ×N in source text means N whole actions/FS chains, not N BA taps.
     const repeat=a.text.match(/×\s*(\d+)/u)?.[1];
     const modifier=repeat?'×'+repeat:(a.input.count&&a.input.count>1?'×'+a.input.count:'');
     if(modifier&&!b.key.includes(modifier))primary.append(node('span','action-compact-modifier',modifier));
     if(a.optional||a.condition){
      const marker=a.condition&&/stagger/i.test(a.condition)?'Stagger':a.condition?'Условно':'Опц.';
      primary.append(node('span','action-compact-condition',marker));
     }
     chip.title=[b.name,a.condition?'Если: '+a.condition:'',a.hint||''].filter(Boolean).join('\n');
     if(compact){
      chip.setAttribute('role','group');
      chip.setAttribute('aria-label',[actor.name,b.key,a.text,a.condition?'Если: '+a.condition:'',a.hint||''].filter(Boolean).join(' · '));
     }
     chip.append(primary,node('span','action-label',b.name));
    }else chip.append(node('strong','keycap',b.key),node('span','action-label',b.name));
    if(a.optional)chip.append(node('span','action-optional',a.condition?'УСЛОВНО':'НЕОБЯЗАТЕЛЬНО'));
    if(a.condition)chip.append(node('span','action-condition','Если: '+a.condition));
    if(a.hint)chip.append(node('span','action-hint',a.hint));
    if(a.optional)chip.classList.add('optional-action');
    if(book.game==='arknights-endfield'&&showArts){
     // Only display opted-in checkpoints on this exact action.
     // Hiding removes annotation nodes, their titles and their ARIA descriptions.
     const arts=createArtsActionEffect(s.artsCheckpoints,j,base);
     if(arts){
      chip.classList.add('arts-annotated');
      // Inline beside portrait/keycap, not a second row or stage header.
      chip.querySelector<HTMLElement>('.action-primary')!.append(arts);
      const explanation=arts.querySelector<HTMLElement>('.arts-action-effect')?.getAttribute('aria-label')||'';
      chip.title+='\n'+explanation;
      if(compact)chip.setAttribute('aria-label',(chip.getAttribute('aria-label')||a.text)+' · '+explanation);
     }
    }
    seq.append(chip);
   }
   body.append(seq);
   const note=node('div','checks');note.append(node('span','diamond','✧'),node('span','',s.check));body.append(note);
   if(s.extra)body.append(node('p','extras',s.extra));
   card.append(body);route.append(card);
  }
  q('#navigation').classList.toggle('hidden',!focus);
  q<HTMLButtonElement>('#prev').disabled=at===ids.length-1&&ids.length===1||at===0;
  q('#next').textContent=at===ids.length-1?(tracksProgress?'↺ Новый круг':'↺ К началу'):'Далее →';
 }
 function setOpener(value:boolean){if(opener===value)return;opener=value;set('opener',opener);readProgress();render()}
 q('#opener').addEventListener('click',()=>setOpener(true));
 q('#loop').addEventListener('click',()=>setOpener(false));
 q('#view').addEventListener('click',()=>{focus=!focus;set('focus',focus);render();if(focus)q('#route').scrollIntoView({block:'start',behavior:'smooth'})});
 if(tracksProgress)q('#reset').addEventListener('click',()=>{done=done.map(()=>false);at=0;persist();render();toast('Прогресс сброшен')});
 q('#prev').addEventListener('click',()=>{at=Math.max(0,at-1);persist();render();q('#route').scrollIntoView({block:'start',behavior:'smooth'})});
 q('#next').addEventListener('click',()=>{if(at>=stageKeys().length-1){at=0;if(tracksProgress)done=done.map(()=>false);toast(tracksProgress?'Новый круг':'К первому этапу')}else{if(tracksProgress)done[at]=true;at++}persist();render();q('#route').scrollIntoView({block:'start',behavior:'smooth'})});
 q('#info').addEventListener('click',()=>toast(tracksProgress?'Тапни ✓ для отметки этапа. Переключай варианты сверху.':'Выбери вариант ротации сверху; компактный вид — быстрая памятка без отметок выполнения.'));
 render();
 type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<unknown>};
 let installEvent:InstallPrompt|null=null;
 const banner=q('#install');
 window.addEventListener('beforeinstallprompt',(e:Event)=>{e.preventDefault();installEvent=e as InstallPrompt;banner.classList.remove('hidden')});
 q('#install-btn').addEventListener('click',async()=>{if(!installEvent)return;banner.classList.add('hidden');await installEvent.prompt();try{await installEvent.userChoice}catch{}installEvent=null});
 q('#install-close').addEventListener('click',()=>banner.classList.add('hidden'));
 window.addEventListener('appinstalled',()=>{banner.classList.add('hidden');toast('Приложение установлено')});
}
