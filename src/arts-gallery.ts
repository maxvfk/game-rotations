// Standalone preview for Arts indicators. No changes to combat rotation data.
import {
 ARTS_ELEMENTS,ARTS_REACTIONS,ARTS_SIZES,ARTS_NAMES,REACTION_NAMES,
 createArtsInfliction,createArtsReaction,
 type ArtsElement,type ArtsReaction,type ArtsIconSize,
 type ArtsStackCount,type ArtsReactionLevel,
} from './arts-indicators';

const el=(tag:string,cls='',value='')=>{
 const x=document.createElement(tag);x.className=cls;if(value)x.textContent=value;return x;
};
function selector<T extends string>(id:string,title:string,choices:readonly {value:T;label:string}[],initial:T){
 const wrap=el('label','arts-select-label',title),select=document.createElement('select');
 select.id=id;select.className='arts-select';
 for(const entry of choices){
  const option=document.createElement('option');option.value=entry.value;option.textContent=entry.label;
  select.append(option);
 }
 select.value=initial;wrap.append(select);return {wrap,select};
}
function previewCard(title:string,sub:string,icon:HTMLElement){
 const card=el('div','arts-selected-card'),spot=el('div','arts-selected-icon');
 spot.append(icon);
 card.append(spot,el('div','arts-selected-label'));
 const label=card.querySelector('.arts-selected-label')!;
 label.append(el('strong','',title),el('span','',sub));
 return card;
}

export function mountArtsGallery(root:HTMLElement,base:string){
 root.replaceChildren();root.className='arts-preview-root';
 let size:ArtsIconSize=28;
 const heading=el('header','arts-heading');
 const back=el('a','arts-back','← К каталогу игр') as HTMLAnchorElement;
 back.href=base;
 heading.append(back,el('h1','','Arts-индикаторы · Endfield'),
  el('p','arts-lead','Оригинальные игровые кольца из 1–4 секторов и иконки Arts Reaction с отдельным уровнем I–IV. Сравни размеры на мобильном экране.'));
 const notice=el('div','arts-notice','Демонстрация отображения. Числа ниже выбираются вручную и не означают проверенное состояние в ротациях Maygi или Prydwen.');
 const controls=el('section','arts-panel');
 controls.append(el('h2','','Выбор размера и состояния'));
 const sizeLine=el('div','arts-control-bar'),sizeCaption=el('span','arts-control-label','РАЗМЕР'),sizeButtons=el('div','arts-size-options');
 sizeButtons.setAttribute('role','group');sizeButtons.setAttribute('aria-label','Размер Arts-значков');
 for(const n of ARTS_SIZES){
  const b=el('button','arts-size-button',n+' px') as HTMLButtonElement;
  b.type='button';b.dataset.size=String(n);b.setAttribute('aria-pressed',String(n===size));
  b.onclick=()=>{
   size=n;
   for(const btn of sizeButtons.querySelectorAll<HTMLButtonElement>('button')){
    btn.setAttribute('aria-pressed',String(btn===b));
   }
   renderIndicators();
  };
  sizeButtons.append(b);
 }
 sizeLine.append(sizeCaption,sizeButtons);
 const stackItems=[{value:'unknown',label:'? · неизвестно'},{value:'0',label:'0 · нет стаков'},
  ...[1,2,3,4].map(n=>({value:String(n),label:n+' / 4 стаков'}))];
 const levelItems=[{value:'unknown',label:'? · неизвестно'},...['I','II','III','IV'].map((x,i)=>({value:String(i+1),label:x}))];
 const elementSelect=selector('arts-element','Arts Infliction',ARTS_ELEMENTS.map(n=>({value:n,label:ARTS_NAMES[n]})),'cryo');
 const stackSelect=selector('arts-stacks','Количество стаков',stackItems,'4');
 const reactionSelect=selector('arts-reaction','Arts Reaction',ARTS_REACTIONS.map(n=>({value:n,label:REACTION_NAMES[n]})),'corrosion');
 const levelSelect=selector('arts-level','Уровень реакции',levelItems,'4');
 const selectors=el('div','arts-selectors');
 selectors.append(elementSelect.wrap,stackSelect.wrap,reactionSelect.wrap,levelSelect.wrap);
 const selected=el('div','arts-selected');
 controls.append(sizeLine,selectors,selected);

 const infPanel=el('section','arts-panel'),infMatrix=el('div','arts-stack-matrix');
 infPanel.append(el('h2','','Arts Infliction — все четыре игровых кольца'),infMatrix,
  el('p','arts-smallnote','Каждый заполненный сектор — один стек. Отдельных исходных PNG для нуля или неизвестного состояния нет.'));
 const reactionPanel=el('section','arts-panel'),rxMatrix=el('div','arts-reaction-matrix');
 reactionPanel.append(el('h2','','Arts Reaction — игровые значки и уровни I–IV'),rxMatrix,
  el('p','arts-smallnote','Уровень реакции — отдельная метка, не часть игрового PNG. Числа здесь демонстрационные.'));
 const footer=el('footer','arts-footer');
 footer.append('Источник файлов, SHA-256 и атрибуция: ');
 const source=el('a','','Каталог Arts-иконок в GitHub') as HTMLAnchorElement;
 source.href='https://github.com/maxvfk/game-rotations/blob/main/docs/ENDFIELD_ARTS_ICONS.md';
 source.target='_blank';source.rel='noopener noreferrer';footer.append(source,'.');
 root.append(heading,notice,controls,infPanel,reactionPanel,footer);

 function renderIndicators(){
  selected.replaceChildren();
  const elem=elementSelect.select.value as ArtsElement;
  const countValue=stackSelect.select.value;
  const stacks:ArtsStackCount=countValue==='unknown'?null:Number(countValue) as ArtsStackCount;
  const reaction=reactionSelect.select.value as ArtsReaction;
  const levelValue=levelSelect.select.value;
  const level:ArtsReactionLevel=levelValue==='unknown'?null:Number(levelValue) as ArtsReactionLevel;
  selected.append(
   previewCard(ARTS_NAMES[elem]+' Infliction',stacks===null?'Неизвестное количество':stacks===0?'Нет стаков':stacks+' из 4 стаков',
    createArtsInfliction({element:elem,stacks,size,base})),
   previewCard(REACTION_NAMES[reaction],level===null?'Уровень неизвестен':'Уровень '+['','I','II','III','IV'][level],
    createArtsReaction({reaction,level,size,base})),
  );
  infMatrix.replaceChildren();
  for(const element of ARTS_ELEMENTS){
   const row=el('article','arts-matrix-row'),icons=el('div','arts-matrix-icons');
   row.append(el('div','arts-matrix-name',ARTS_NAMES[element]));
   for(const n of [1,2,3,4] as const){
    const unit=el('div','arts-matrix-unit');
    unit.append(createArtsInfliction({element,stacks:n,size,base}),el('small','',String(n)));
    icons.append(unit);
   }
   row.append(icons);infMatrix.append(row);
  }
  rxMatrix.replaceChildren();
  for(const reaction of ARTS_REACTIONS){
   const card=el('article','arts-reaction-card'),info=el('div','');
   info.append(el('div','arts-reaction-name',REACTION_NAMES[reaction]),el('div','arts-reaction-meta','I–IV, только пример'));
   const icons=el('div','arts-matrix-icons');
   for(const level of [1,2,3,4] as const){
    const unit=el('div','arts-matrix-unit');
    unit.append(createArtsReaction({reaction,level,size,base}));
    icons.append(unit);
   }
   card.append(info,icons);rxMatrix.append(card);
  }
 }
 for(const select of [elementSelect.select,stackSelect.select,reactionSelect.select,levelSelect.select]){
  select.addEventListener('change',renderIndicators);
 }
 renderIndicators();
}
