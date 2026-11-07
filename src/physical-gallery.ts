// Read-only demonstration of Physical Status icon assets (not a combat simulator).
import {createPhysicalVulnerability,createPhysicalEffect,PHYSICAL_EFFECTS,PHYSICAL_EFFECT_NAMES,PHYSICAL_EFFECT_BEHAVIORS,PHYSICAL_ICON_SIZES,
 type PhysicalEffect,type PhysicalStacks,type PhysicalIconSize} from './physical-indicators';
const el=(tag:string,cls='',value='')=>{const n=document.createElement(tag);n.className=cls;if(value)n.textContent=value;return n;};
function select(label:string,id:string,options:{value:string;label:string}[],selected:string){
 const wrap=el('label','arts-select-label',label),input=document.createElement('select');
 input.id=id;input.className='arts-select';
 for(const x of options){const option=document.createElement('option');option.value=x.value;option.textContent=x.label;input.append(option);}
 input.value=selected;wrap.append(input);return {wrap,input};
}
function selectedCard(title:string,subtitle:string,icon:HTMLElement){
 const card=el('div','arts-selected-card'),spot=el('div','arts-selected-icon'),body=el('div','arts-selected-label');
 spot.append(icon);body.append(el('strong','',title),el('span','',subtitle));card.append(spot,body);return card;
}

export function mountPhysicalGallery(root:HTMLElement,base:string){
 root.replaceChildren();root.className='arts-preview-root physical-preview-root';
 let size:PhysicalIconSize=28;
 const back=el('a','arts-back','← К каталогу игр') as HTMLAnchorElement;back.href=base;
 const intro=el('header');intro.append(back,el('h1','','Физические статусы · Endfield'),
  el('p','arts-lead','Оригинальные игровые кольца Vulnerability (1–4 стака) и четыре отдельных glyphs физических эффектов. Это демонстрация значков, а не проверка ротации.'));
 const notice=el('div','arts-notice','Vulnerability — накопленный статус цели. Lift/Knock Down — наращивание; Crush/Breach — расходование стаков. Цифры выбираются вручную, не вычисляются из действий.');
 const control=el('section','arts-panel');
 control.append(el('h2','','Просмотр при разных размерах'));
 const sizes=el('div','arts-control-bar'),buttons=el('div','arts-size-options');
 buttons.setAttribute('role','group');buttons.setAttribute('aria-label','Размер физических значков');
 for(const n of PHYSICAL_ICON_SIZES){
  const b=el('button','arts-size-button',n+' px') as HTMLButtonElement;b.type='button';b.dataset.physicalSize=String(n);
  b.setAttribute('aria-pressed',String(n===size));b.onclick=()=>{
   size=n;for(const child of buttons.querySelectorAll('button'))child.setAttribute('aria-pressed',String(child===b));render();
  };buttons.append(b);
 }
 sizes.append(el('span','arts-control-label','РАЗМЕР'),buttons);
 const s=select('Vulnerability stacks','physical-stacks',[
  {value:'unknown',label:'? · неизвестно'},{value:'0',label:'0 · нет стаков'},
  ...[1,2,3,4].map(n=>({value:String(n),label:n+' / 4'}))],'4');
 const t=select('Physical Status effect','physical-effect',PHYSICAL_EFFECTS.map(v=>({value:v,label:PHYSICAL_EFFECT_NAMES[v]})),'crush');
 const selectors=el('div','arts-selectors');selectors.append(s.wrap,t.wrap);
 const selected=el('div','physical-selected');control.append(sizes,selectors,selected);
 const stackPanel=el('section','arts-panel'),stackMatrix=el('div','physical-stack-matrix');
 stackPanel.append(el('h2','','Vulnerability — оригинальные кольца 1–4'),stackMatrix,
  el('p','arts-smallnote','Оригинальные PNG уже содержат заполненные сектора. Для 0 и неизвестного значения исходного кольца нет.'));
 const effectPanel=el('section','arts-panel'),effectMatrix=el('div','physical-effect-matrix');
 effectPanel.append(el('h2','','Physical Status — четыре игровых glyphs'),effectMatrix,
  el('p','arts-smallnote','Это оригинальные значки боевых эффектов (damage-text glyphs), не самостоятельные persistent debuff PNG. У Lift/Knock Down нет уровня I–IV; Crush/Breach расходуют имеющиеся Vulnerability stacks.'));
 const details=el('section','arts-panel');
 details.append(el('h2','','Как работает физическая система'),
  el('p','physical-details','На цели без Vulnerability обычный Physical Status сначала даёт 1 стек. При наличии Vulnerability Lift / Knock Down добавляют по 1 (до 4) и вызывают Stagger / возможный контроль; Crush / Breach расходуют стаки, причём Breach дополнительно повышает получаемый Physical DMG. Отдельные навыки могут принудительно накладывать Lift или Knock Down. Для фактических значений конкретной ротации нужна проверка live-kit, trigger и попадания в одну цель.'),
  el('p','physical-details','Shatter — особое взаимодействие Physical Status/Vulnerability с уже действующей Solidification. Оно не является пятой физической категорией и сюда не добавлено без однозначного исходного спрайта.'));
 const footer=el('footer','arts-footer','Источник и точные контрольные суммы: ');
 const link=el('a','','PHYSICAL_ICONS.md') as HTMLAnchorElement;
 link.href='https://github.com/maxvfk/game-rotations/blob/main/docs/ENDFIELD_PHYSICAL_ICONS.md';
 link.target='_blank';link.rel='noopener noreferrer';footer.append(link);
 root.append(intro,notice,control,stackPanel,effectPanel,details,footer);
 function render(){
  const value=s.input.value,stacks:PhysicalStacks=value==='unknown'?null:Number(value) as PhysicalStacks;
  const effect=t.input.value as PhysicalEffect;
  selected.replaceChildren(selectedCard('Vulnerability',stacks===null?'Число стаков неизвестно':stacks===0?'Нет стаков':stacks+'/4 стаков',createPhysicalVulnerability({stacks,size,base})),
   selectedCard(PHYSICAL_EFFECT_NAMES[effect],PHYSICAL_EFFECT_BEHAVIORS[effect],createPhysicalEffect({effect,size,base})));
  stackMatrix.replaceChildren();
  for(const n of [1,2,3,4] as const){
   const card=el('div','physical-matrix-card'),spot=el('div','physical-icon-holder');
   spot.append(createPhysicalVulnerability({stacks:n,size,base}));card.append(spot,el('strong','',String(n)+' / 4'));stackMatrix.append(card);
  }
  effectMatrix.replaceChildren();
  for(const e of PHYSICAL_EFFECTS){
   const card=el('article','physical-matrix-card'),spot=el('div','physical-icon-holder');
   spot.append(createPhysicalEffect({effect:e,size,base}));card.append(spot,el('strong','',PHYSICAL_EFFECT_NAMES[e]),el('small','',PHYSICAL_EFFECT_BEHAVIORS[e]));
   effectMatrix.append(card);
  }
 }
 s.input.addEventListener('change',render);t.input.addEventListener('change',render);render();
}
