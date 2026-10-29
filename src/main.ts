import catalog from '../data/catalog.json';
import './style.css';

type Character = {id:string;name:string;investment:string;portrait:string};
type Team = {id:string;name:string;subtitle:string;path:string;characters:Character[];status:string;statusDescription:string;gameVersion:string;source:string;variants:{id:string;name:string;verification:string}[]};
type Game = {id:string;name:string;shortName:string;mark:string;accent:string;status:string;subtitle:string;teams:Team[]};
type Catalog = {schemaVersion:number;games:Game[]};
const data:Catalog=catalog;
const root=document.querySelector<HTMLDivElement>('#app')!;
const savedKey='game-rotations:v1:';
const load=(key:string,fallback:string)=>{try{return localStorage.getItem(savedKey+key)??fallback}catch{return fallback}};
const save=(key:string,value:string)=>{try{localStorage.setItem(savedKey+key,value)}catch{}};
let selectedGame=load('game','all'), search='',favoritesOnly=false;
const favorites=new Set<string>(JSON.parse(load('favorites','[]')));
const base=import.meta.env.BASE_URL;
const make=(tag:string,cls='',value='')=>{const e=document.createElement(tag);e.className=cls;if(value)e.textContent=value;return e};
const node=(tag:string,cls:string,...children:(Node|string)[])=>{const e=make(tag,cls);for(const child of children)e.append(child);return e};
function counter(){return data.games.reduce((n,g)=>n+g.teams.length,0)}
function render(){
 root.replaceChildren();
 const header=node('header','head',node('div','brandmark','✦'),node('div','head-text',node('div','eyebrow','PERSONAL ROTATION LIBRARY'),node('div','brandname','Game Rotations')));
 const meta=node('div','head-meta',node('span','online-pip'),node('span','',counter()+' команда · '+data.games.filter(g=>g.status==='available').length+' игра'));
 header.append(meta);
 const hero=node('section','hero',node('div','eyebrow','КОМАНДЫ, КОТОРЫЕ ТЫ ВЫБРАЛ'),node('h1','','Все ротации ','в одном месте'),node('p','','Выбирай игру и команду. Памятки по кнопкам, пошаговые действия и собственные варианты — даже без интернета.'));
 const controls=node('section','searchbar');
 const searchBox=document.createElement('input');searchBox.type='search';searchBox.placeholder='Найти игру или команду';searchBox.setAttribute('aria-label','Поиск по играм и командам');searchBox.value=search;
 searchBox.addEventListener('input',()=>{search=searchBox.value;render();const r=document.querySelector<HTMLInputElement>('input[type=search]');r?.focus();r?.setSelectionRange(search.length,search.length)});
 const favBtn=node('button','favorite-filter',favoritesOnly?'★ Только избранное':'☆ Избранное') as HTMLButtonElement;favBtn.setAttribute('aria-pressed',String(favoritesOnly));favBtn.onclick=()=>{favoritesOnly=!favoritesOnly;render()};
 controls.append(node('label','search-shell',node('span','search-icon','⌕'),searchBox),favBtn);
 const nav=node('nav','game-tabs');nav.setAttribute('aria-label','Фильтр игр');
 const addTab=(id:string,label:string)=>{const btn=node('button','game-tab'+(selectedGame===id?' selected':''),label) as HTMLButtonElement;btn.setAttribute('aria-pressed',String(selectedGame===id));btn.onclick=()=>{selectedGame=id;save('game',id);render()};nav.append(btn)};
 addTab('all','Все игры'); for(const g of data.games)addTab(g.id,g.shortName);
 const list=node('main','library');let displayed=0;
 for(const game of data.games){
  if(selectedGame!=='all' && selectedGame!==game.id)continue;
  const available=game.teams.filter(t=>{const q=(game.name+' '+t.name+' '+t.subtitle).toLowerCase();return (!search||q.includes(search.trim().toLowerCase()))&&(!favoritesOnly||favorites.has(t.id))});
  if(search && !available.length && !(game.name.toLowerCase().includes(search.toLowerCase()) && game.status==='planned'))continue;
  if(favoritesOnly && !available.length)continue;
  displayed++;
  const section=node('section','game-section');section.style.setProperty('--game-color',game.accent);
  const title=node('div','game-heading',node('div','game-icon',game.mark),node('div','game-description',node('h2','',game.name),node('p','',game.subtitle)));
  if(game.status!=='available')title.append(node('span','soon','Скоро'));else title.append(node('span','count',String(available.length)+' команда'));
  section.append(title);
  if(!available.length){section.append(node('div','empty-game','Команды появятся здесь после выбора и проверки ротаций.'));list.append(section);continue}
  for(const team of available){
   const card=node('article','team-card');
   const faces=node('div','team-faces');
   for(const c of team.characters){const img=document.createElement('img');img.src=base+c.portrait;img.alt=c.name;img.loading='lazy';faces.append(img)}
   card.append(faces,node('div','team-copy',node('h3','',team.name),node('p','',team.subtitle),node('div','team-labels',node('span','version',team.gameVersion),node('span','adapted',team.variants.length+' варианта'))));
   const buttons=node('div','team-actions');
   const f=node('button','star'+(favorites.has(team.id)?' active':''),favorites.has(team.id)?'★':'☆') as HTMLButtonElement;f.setAttribute('aria-label',favorites.has(team.id)?'Убрать из избранного':'Добавить в избранное');f.setAttribute('aria-pressed',String(favorites.has(team.id)));f.onclick=()=>{if(favorites.has(team.id))favorites.delete(team.id);else favorites.add(team.id);save('favorites',JSON.stringify([...favorites]));render()};
   const open=node('a','open-route','Открыть ротации ›') as HTMLAnchorElement;open.href=base+'?team='+encodeURIComponent(team.id);
   buttons.append(f,open);card.append(buttons);section.append(card);
  }
  list.append(section);
 }
 if(!displayed)list.append(node('div','empty-state','Ничего не найдено. Сними фильтр или попробуй другой запрос.'));
 const footer=node('footer','footer',node('p','','Исследования и механики хранятся в maxvfk/Games. Здесь — только выбранные боевые памятки.'),node('a','','Исходные гайды ↗'));(footer.lastChild as HTMLAnchorElement).href='https://github.com/maxvfk/Games/tree/main/guides';(footer.lastChild as HTMLAnchorElement).target='_blank';
 root.append(header,hero,controls,nav,list,footer);
}
const requestedTeam=new URLSearchParams(window.location.search).get('team');
if(requestedTeam){
 import('./rotation').then(({hasRotation,mountRotation})=>{
  if(hasRotation(requestedTeam)){mountRotation(root,requestedTeam,base,base)}else{render();root.prepend(node('p','empty-state','Ротация не найдена. Открой команду из каталога.'))}
 }).catch((error:unknown)=>{console.error('Could not open rotation',error);render();root.prepend(node('p','empty-state','Не удалось открыть ротацию. Проверь соединение и попробуй снова.'))});
}else render();
