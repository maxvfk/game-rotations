import portraitData from '../data/portraits/wuthering-waves.json';
import './portrait-gallery.css';
type Portrait={id:string;name:string;element:string;rarity:number;portrait:string;sourcePage:string;sourceImage:string;sourceSha256Prefix:string};
type Catalog={schemaVersion:number;game:string;characters:Portrait[];aliases:Record<string,string>};
const registry:Catalog=portraitData;
const el=(tag:string,cls='',label='')=>{const x=document.createElement(tag);x.className=cls;if(label)x.textContent=label;return x};
export function mountPortraitGallery(root:HTMLElement,base:string){
 root.replaceChildren();root.className='portraits-root';
 const heading=el('header','portrait-heading');
 const back=el('a','portrait-back','← К каталогу игр') as HTMLAnchorElement;back.href=base;
 heading.append(back,el('h1','','Wuthering Waves · Портреты'),el('p','','Проверенный каталог миниатюр из сохранённой страницы Prydwen. Выбирай по имени персонажа, а не по исходному имени изображения.'));
 const bar=el('div','portrait-tools');
 const search=el('input','portrait-search') as HTMLInputElement;search.placeholder='Поиск по имени, ID или стихии';search.type='search';search.setAttribute('aria-label','Поиск по персонажам');
 const counter=el('span','portrait-counter');
 bar.append(search,counter);
 const grid=el('main','portrait-grid');
 root.append(heading,bar,grid);
 const displayed=registry.characters.slice().sort((a,b)=>a.name.localeCompare(b.name));
 function render(){
  const query=search.value.trim().toLowerCase();const alias=registry.aliases[query]??query;
  const filtered=displayed.filter(c=>[c.name,c.id,c.element].some(s=>s.toLowerCase().includes(query))||c.id===alias);
  grid.replaceChildren();counter.textContent=filtered.length+' / '+displayed.length+' персонажей и вариантов';
  for(const item of filtered){
   const box=el('article','portrait-card');
   const img=document.createElement('img');img.src=base+item.portrait;img.alt=item.name;img.loading='lazy';img.decoding='async';
   img.onerror=()=>{box.classList.add('portrait-broken');img.alt='Файл не найден: '+item.id};
   const name=el('div','portrait-name',item.name),attr=el('div','portrait-attributes',item.element+' · '+item.rarity+'★');
   const code=el('code','portrait-id',item.id);
   const actions=el('div','portrait-actions');
   const copy=el('button','portrait-copy','Копировать путь');copy.setAttribute('aria-label','Скопировать путь к портрету '+item.name);
   copy.onclick=async()=>{const path=item.portrait;try{await navigator.clipboard.writeText(path);copy.textContent='✓ Скопировано'}catch{copy.textContent=path}setTimeout(()=>{copy.textContent='Копировать путь'},2400)};
   const source=el('a','portrait-source','Prydwen ↗') as HTMLAnchorElement;source.href=item.sourcePage;source.target='_blank';source.rel='noopener noreferrer';
   actions.append(copy,source);box.append(img,name,attr,code,actions);grid.append(box);
  }
 }
 search.oninput=render;render();
}