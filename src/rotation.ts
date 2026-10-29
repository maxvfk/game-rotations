import './rotation.css';
import wuwaBook from '../data/rotations/wuthering-waves/yyxl-suisui-chisa.json';
import wuwaControls from '../data/controls/wuthering-waves.json';
import type {RotationBook, RotationStage, RotationCharacter, Action, ControlMap, Scheme, RotationVariant} from './rotation-types';

const BOOKS:Record<string,RotationBook> = {'yyxl-suisui-chisa':wuwaBook as unknown as RotationBook};
const SCHEMES:Record<string,ControlMap> = {'wuthering-waves':wuwaControls as unknown as ControlMap};
const SHELL = "<nav class=\"catalog-back\"><a id=\"catalog-link\" href=\"../\">← Каталог игр и команд</a></nav>\n<div class=\"wrap\">\n <div class=\"topline\"><div class=\"sigil\"><div class=\"emblem\" aria-hidden=\"true\">✦</div><div><div class=\"overline\">FIELD NOTES / GAME ROTATIONS</div><div class=\"little\"><span id=\"route-version\"></span></div></div></div><button class=\"iconbtn\" id=\"info\" title=\"Справка\" aria-label=\"Справка\">ⓘ</button></div>\n <header><h1>Боевые <em>ротации</em></h1><p class=\"hero-sub\">Выбранные ротации команды с подсказками по действиям и ресурсам.</p></header>\n <div class=\"team\" id=\"team\" aria-label=\"Состав команды\"></div>\n <p class=\"section-label\">Выбери ротацию</p><div class=\"tabs\" role=\"tablist\" aria-label=\"Вариант ротации\" id=\"tabs\"></div>\n <div class=\"meta\" id=\"meta\" aria-live=\"polite\"></div>\n <div class=\"input-controls\"><span class=\"control-caption\">ОБОЗНАЧЕНИЯ</span><div class=\"seg input-seg\" id=\"control-selector\" role=\"group\" aria-label=\"Схема управления\"></div><button class=\"slots-btn\" id=\"slots-btn\" type=\"button\" aria-expanded=\"false\" aria-controls=\"slots-panel\">Слоты: 1 / 2 / 3 · изменить</button></div><div id=\"keyhelp\" class=\"keyhelp\" aria-live=\"polite\"></div>\n <div class=\"slots-panel hidden\" id=\"slots-panel\"></div>\n <div class=\"controlbar\"><div class=\"seg\" role=\"group\" aria-label=\"Начало или повторный цикл\"><button id=\"opener\" aria-pressed=\"false\">Первый заход</button><button id=\"loop\" aria-pressed=\"true\">Повтор</button></div><div class=\"control-right\"><button class=\"mini\" id=\"view\" aria-label=\"Переключить режим просмотра\">☷ Все этапы</button><button class=\"mini\" id=\"reset\" aria-label=\"Сбросить прогресс\">↺ Сброс</button></div></div>\n <div class=\"progress-wrap\"><div class=\"progress-row\"><strong id=\"progress-label\">ПРОГРЕСС</strong><span id=\"progress-count\"></span></div><div class=\"progress-track\" role=\"progressbar\" aria-label=\"Выполненные этапы\" aria-valuemin=\"0\" aria-valuemax=\"100\" id=\"progress-track\"><div class=\"progress-fill\" id=\"progress-fill\"></div></div></div>\n <main id=\"route\" class=\"route\" aria-live=\"polite\"></main><div id=\"navigation\" class=\"foot-steps hidden\"><button class=\"nav\" id=\"prev\">← Назад</button><button class=\"nav primary\" id=\"next\">Далее →</button></div>\n <footer class=\"bottom\"><p id=\"control-summary\"></p><p><strong style=\"color:#e5e0e4\">Точность:</strong> <span id=\"route-verification\"></span></p><p class=\"control-footnote\">Иллюстрации принадлежат правообладателям соответствующих игр; изображения хранятся локально для офлайн-режима.</p><a id=\"route-source\" target=\"_blank\" rel=\"noopener noreferrer\">Открыть подробный гайд ↗</a></footer>\n</div>\n\n<div class=\"install hidden\" id=\"install\"><p>Установить библиотеку для офлайн-доступа?</p><button id=\"install-btn\">Установить</button><button id=\"install-close\" class=\"dismiss\" aria-label=\"Закрыть\">×</button></div><div class=\"toast hidden\" id=\"toast\" role=\"status\"></div>";
const node=(tag:string,cls='',value='')=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value)el.textContent=value;return el};
const saved=(prefix:string)=>(key:string,def:unknown):any=>{try{const value=localStorage.getItem(prefix+key);return value===null?def:JSON.parse(value)}catch{return def}};
const write=(prefix:string)=>(key:string,value:unknown)=>{try{localStorage.setItem(prefix+key,JSON.stringify(value))}catch{}};
type Bound = {key:string;name:string;kind?:string};
export function hasRotation(id:string){return Object.hasOwn(BOOKS,id)}
export function mountRotation(root:HTMLDivElement,id:string,backUrl:string,base:string){
 const book=BOOKS[id], controlMap=SCHEMES[book?.controls];
 if(!book||!controlMap)throw new Error('Unknown rotation or controls: '+id);
 root.classList.add('rotation-app');root.innerHTML=SHELL;
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
 const storagePrefix=id==='yyxl-suisui-chisa'?'wuwa-r-v1:':'game-rotations:v2:'+id+':';
 const get=saved(storagePrefix),set=write(storagePrefix);
 const slotIds=Object.keys(book.defaultSlots);
 const values=Object.values(book.defaultSlots);
 let slots:Record<string,string>={...book.defaultSlots};
 const initialSlots=get('slots',book.defaultSlots) as Record<string,string>;
 if(initialSlots && slotIds.every(k=>values.includes(initialSlots[k])) && new Set(slotIds.map(k=>initialSlots[k])).size===slotIds.length)slots={...initialSlots};
 let controls=String(get('controls',controlMap.schemes[0]?.id??'terms'));
 if(!controlMap.schemes.some(s=>s.id===controls))controls=controlMap.schemes[0].id;
 let slotsOpen=false;
 const selector=q('#control-selector');
 for(const scheme of controlMap.schemes){
  const btn=node('button','',scheme.label) as HTMLButtonElement;btn.id='control-'+scheme.id;
  btn.setAttribute('aria-pressed',String(controls===scheme.id));
  btn.onclick=()=>{controls=scheme.id;set('controls',controls);render()};
  selector.append(btn);
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
  if(k==='intro')return {key:isDescriptive()?'Intro':slotKey(person.id),name:'Intro · смена персонажа'};
  if(k==='outro'||k==='swap')return {key:isDescriptive()?(k==='outro'?'Outro':'Swap'):slotKey(input.target||person.id),name:x};
  let key=scheme.keys[k]||'?',name=x;
  if(k==='basic'&&input.repeat)key=scheme.keys.repeat||key;
  else if(k==='basic'&&input.count&&input.count>1)key+=' ×'+input.count;
  if(k==='skill'&&x.startsWith('E · '))name=x.slice(4);
  if(k==='ultimate')name=x==='R'?'Liberation':x.replace(/^R · /,'');
  if(k==='echo'&&x==='Heron')name='Heron · Echo';
  if(k==='auto'){name=x+' · после попадания HA';}
  if(k==='basic'&&x==='Swallow’s Cut')name='Swallow’s Cut · в воздухе';
  if(k==='basic'&&input.repeat)name='Death Snip FULL · добить удары';
  if(k==='basic'&&x==='Bloom 1–3')name='Havoc in Bloom 1–3';
  return {key,name,kind:k==='auto'?'auto':undefined};
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
 let mode=String(get('mode',book.variants[0].id)),opener=Boolean(get('opener',false)),focus=Boolean(get('focus',false));
 if(!book.variants.some(v=>v.id===mode))mode=book.variants[0].id;
 let at=0,done:boolean[]=[];
 const currentVariant=():RotationVariant=>book.variants.find(v=>v.id===mode)!;
 const progressKey=()=>mode+'-'+(opener?'opener':'loop');
 const stageKeys=()=>opener?currentVariant().opener:currentVariant().loop;
 function readProgress(){
  const size=stageKeys().length,prev=get('done:'+progressKey(),[]) as boolean[];
  done=Array.from({length:size},(_,i)=>!!prev?.[i]);
  at=Math.max(0,Math.min(Number(get('at:'+progressKey(),0))||0,size-1));
 }
 function persist(){set('done:'+progressKey(),done);set('at:'+progressKey(),at)}
 readProgress();
 let timeout=0;function toast(message:string){
  const t=q('#toast');t.textContent=message;t.classList.remove('hidden');window.clearTimeout(timeout);
  timeout=window.setTimeout(()=>t.classList.add('hidden'),2300);
 }
 function render(){
  renderControls();renderSlots();
  const tabs=q('#tabs');tabs.replaceChildren();
  for(const v of book.variants){
   const b=node('button','tab') as HTMLButtonElement;b.setAttribute('role','tab');
   b.setAttribute('aria-selected',String(mode===v.id));b.tabIndex=mode===v.id?0:-1;
   b.append(node('strong','',v.label),node('small','',v.sub));b.onclick=()=>{mode=v.id;set('mode',mode);readProgress();render()};tabs.append(b);
  }
  const v=currentVariant(),meta=q('#meta');meta.replaceChildren(node('span','meta-badge'+(v.verification==='experimental'?' exp':''),v.type),node('p','',v.intro));
  q('#opener').setAttribute('aria-pressed',String(opener));q('#loop').setAttribute('aria-pressed',String(!opener));
  q('#view').textContent=focus?'▦ Все этапы':'☷ По шагам';
  const ids=stageKeys(),pct=Math.round(done.filter(Boolean).length/ids.length*100);
  q('#progress-count').textContent=done.filter(Boolean).length+' / '+ids.length+' этапов';
  q<HTMLElement>('#progress-fill').style.width=pct+'%';q('#progress-track').setAttribute('aria-valuenow',String(pct));
  const route=q('#route');route.replaceChildren();
  for(const [i,stageId] of ids.entries()){
   if(focus && i!==at)continue;
   const s:RotationStage=book.stages[stageId],person=characterById.get(s.person)!;
   const card=node('article','stage'+(done[i]?' completed':'')+(i===at?' active':''));
   card.style.setProperty('--accent',person.color);
   const head=node('div','stage-head'),portrait=node('div','portrait');
   const face=document.createElement('img');face.src=base+person.portrait;face.alt='Портрет '+person.name;face.loading='lazy';
   face.onerror=()=>{portrait.replaceChildren(node('span','fallback',person.glyph))};portrait.append(face);
   const heading=node('div');heading.style.flex='1';
   heading.append(node('div','stage-num',String(i+1).padStart(2,'0')+' / '+String(ids.length).padStart(2,'0')+' · '+person.name),node('div','stage-title',s.title),node('div','stage-sub',s.sub));
   const check=node('button','complete',done[i]?'✓':'○') as HTMLButtonElement;
   check.setAttribute('aria-label',done[i]?'Отменить выполнение этапа':'Отметить этап выполненным');
   check.setAttribute('aria-pressed',String(done[i]));
   check.onclick=()=>{done[i]=!done[i];persist();render()};
   head.append(portrait,heading,check);card.append(head);
   const body=node('div','stage-body'),seq=node('div','sequence');
   for(const [j,a] of s.actions.entries()){
    if(j)seq.append(node('span','arr','›'));
    const b=binding(a,person),chip=node('span','action '+(a.tone==='normal'?'':a.tone)+(b.kind?' '+b.kind:'')+(controls==='ps5'?' ps5':''));
    chip.title=a.text;chip.append(node('strong','keycap',b.key),node('span','action-label',b.name));seq.append(chip);
   }
   body.append(seq);
   const note=node('div','checks');note.append(node('span','diamond','✧'),node('span','',s.check));body.append(note);
   if(s.extra)body.append(node('p','extras',s.extra));
   card.append(body);route.append(card);
  }
  q('#navigation').classList.toggle('hidden',!focus);
  q<HTMLButtonElement>('#prev').disabled=at===ids.length-1&&ids.length===1||at===0;
  q('#next').textContent=at===ids.length-1?'↺ Новый круг':'Далее →';
 }
 function setOpener(value:boolean){if(opener===value)return;opener=value;set('opener',opener);readProgress();render()}
 q('#opener').addEventListener('click',()=>setOpener(true));
 q('#loop').addEventListener('click',()=>setOpener(false));
 q('#view').addEventListener('click',()=>{focus=!focus;set('focus',focus);render();if(focus)q('#route').scrollIntoView({block:'start',behavior:'smooth'})});
 q('#reset').addEventListener('click',()=>{done=done.map(()=>false);at=0;persist();render();toast('Прогресс сброшен')});
 q('#prev').addEventListener('click',()=>{at=Math.max(0,at-1);persist();render();q('#route').scrollIntoView({block:'start',behavior:'smooth'})});
 q('#next').addEventListener('click',()=>{if(at>=stageKeys().length-1){at=0;done=done.map(()=>false);toast('Новый круг')}else{done[at]=true;at++}persist();render();q('#route').scrollIntoView({block:'start',behavior:'smooth'})});
 q('#info').addEventListener('click',()=>toast('Тапни ✓ для отметки этапа. Переключай варианты сверху.'));
 render();
 type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<unknown>};
 let installEvent:InstallPrompt|null=null;
 const banner=q('#install');
 window.addEventListener('beforeinstallprompt',(e:Event)=>{e.preventDefault();installEvent=e as InstallPrompt;banner.classList.remove('hidden')});
 q('#install-btn').addEventListener('click',async()=>{if(!installEvent)return;banner.classList.add('hidden');await installEvent.prompt();try{await installEvent.userChoice}catch{}installEvent=null});
 q('#install-close').addEventListener('click',()=>banner.classList.add('hidden'));
 window.addEventListener('appinstalled',()=>{banner.classList.add('hidden');toast('Приложение установлено')});
}
