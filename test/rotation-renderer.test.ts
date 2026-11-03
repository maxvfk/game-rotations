// @vitest-environment jsdom
import {beforeEach,describe,expect,it} from 'vitest';
import {hasRotation,mountRotation} from '../src/rotation';

type TeamId='hsin-suoming-shorekeeper'|'yyxl-suisui-chisa'|'si-tangtang-arcane-xaihi';
const root=()=>document.querySelector<HTMLDivElement>('#app')!;
const element=(selector:string)=>{const found=root().querySelector<HTMLElement>(selector);if(!found)throw new Error('Missing '+selector);return found};
const click=(selector:string)=>element(selector).click();
const stageNames=()=>[...root().querySelectorAll('.stage-title')].map(el=>el.textContent);
const labels=()=>[...root().querySelectorAll('.action-label')].map(el=>el.textContent?.trim()||'');
const keycaps=()=>[...root().querySelectorAll('.keycap')].map(el=>el.textContent?.trim()||'');
const selectTab=(label:string)=>{
 const tab=[...root().querySelectorAll<HTMLButtonElement>('#tabs button')].find(b=>b.querySelector('strong')?.textContent===label);
 if(!tab)throw new Error('Missing variant '+label);
 tab.click();
};
const mount=(id:TeamId)=>{
 expect(hasRotation(id)).toBe(true);
 mountRotation(root(),id,'/game-rotations/','/game-rotations/');
};
beforeEach(()=>{
 document.body.innerHTML='<div id="app"></div>';
 localStorage.clear();
 HTMLElement.prototype.scrollIntoView=()=>{};
});
describe('real shared renderer (actual mounted DOM)',()=>{
 it('opens a previously unseen Hsin team on Shorekeeper cold-start, not the unverified loop',()=>{
  mount('hsin-suoming-shorekeeper');
  expect(element('#opener').getAttribute('aria-pressed')).toBe('true');
  expect(element('#loop').getAttribute('aria-pressed')).toBe('false');
  expect(stageNames()[0]).toBe('Shorekeeper · первый заход');
  expect(labels().filter(x=>x==='BA ×4')).toHaveLength(2);
  expect(element('#progress-count').textContent).toContain('0 / 5');
 });
 it('preserves explicit stored loop=false and named Intro across refresh',()=>{
  localStorage.setItem('game-rotations:v2:hsin-suoming-shorekeeper:opener','false');
  mount('hsin-suoming-shorekeeper');
  expect(element('#loop').getAttribute('aria-pressed')).toBe('true');
  expect(stageNames()[0]).toBe('Shorekeeper · повторный цикл');
  expect(labels()).toContain('Intro · Discernment');
 });
 for(const scheme of ['pc','ps5','terms'] as const){
  it('does not replace repeat attacks / character intros in '+scheme+' controls',()=>{
   mount('hsin-suoming-shorekeeper');
   click('#control-'+scheme);
   expect(labels()).toContain('BA · до 800 Delusion');
   expect(labels()).toContain('Pillars BA · до 0 Heart');
   expect(labels()).toContain('Intro · Whirling Thunder (Unison)');
   expect(labels()).toContain('Intro · Manifold Unison');
   expect(labels()).not.toContain('Death Snip FULL · добить удары');
   // Intro is still mapped to the arriving character's keycap on physical layouts.
   const intro=[...root().querySelectorAll('.action')].find(el=>el.querySelector('.action-label')?.textContent==='Intro · Whirling Thunder (Unison)');
   expect(intro?.querySelector('.keycap')?.textContent).toBe(scheme==='terms'?'Intro':scheme==='pc'?'2':'D-Pad →');
  });
 }
 it('keeps separate Suoming tap/HOLD actions in advanced path, without inventing new kind',()=>{
  mount('hsin-suoming-shorekeeper');
  selectTab('Prydwen + Swap Cancel');
  expect(labels()).toContain('Unforsaken Mind (tap)');
  expect(labels()).toContain('Engraved Heart (HOLD)');
  expect(element('#progress-count').textContent).toContain('0 / 5');
 });
 it('changing opener/loop keeps independent progress and persists explicit mode',()=>{
  mount('hsin-suoming-shorekeeper');
  const firstStage=element('.stage .complete');firstStage.click();
  expect(element('#progress-count').textContent).toContain('1 / 5');
  click('#loop');
  expect(element('#progress-count').textContent).toContain('0 / 5');
  expect(labels()).toContain('Intro · Discernment');
  expect(localStorage.getItem('game-rotations:v2:hsin-suoming-shorekeeper:opener')).toBe('false');
  click('#opener');
  expect(element('#progress-count').textContent).toContain('1 / 5');
 });
 it('preserves all original YYXL variants and stage counts, with correct basic labels',()=>{
  mount('yyxl-suisui-chisa');
  for(const [name,count] of [['1F1A',3],['2F',3],['2F QS',7]] as const){
   selectTab(name);
   expect(root().querySelectorAll('.stage')).toHaveLength(count);
   expect(element('#progress-count').textContent).toContain('0 / '+count);
   if(name!=='2F QS'){
    expect(labels()).toContain('Death Snip · FULL');
    expect(labels()).toContain('Bloom 1–3');
    expect(labels()).toContain('Feather Fall');
   }
   click('#loop');
   expect(root().querySelectorAll('.stage')).toHaveLength(count);
   click('#opener');
  }
  expect(element('#route-source').getAttribute('href')).toContain('github.com/maxvfk/Games');
 });
 it('respects saved YYXL v1 preferences/progress without namespace migration',()=>{
  localStorage.setItem('wuwa-r-v1:opener','false');
  localStorage.setItem('wuwa-r-v1:mode','"two"');
  localStorage.setItem('wuwa-r-v1:controls','"ps5"');
  localStorage.setItem('wuwa-r-v1:done:two-loop','[true,false,false]');
  mount('yyxl-suisui-chisa');
  expect(element('#loop').getAttribute('aria-pressed')).toBe('true');
  expect(element('#control-ps5').getAttribute('aria-pressed')).toBe('true');
  expect(element('#progress-count').textContent).toContain('1 / 3');
  expect(root().querySelector('#tabs button[aria-selected="true"] strong')?.textContent).toBe('2F');
 });
 it('all named Intro, auto and repeat labels match their source action text, not another hero',()=>{
  mount('yyxl-suisui-chisa');
  expect(labels()).toContain('Swallow’s Cut');
  expect(labels()).toContain('Feather Fall');
  expect(labels()).not.toContain('Feather Fall · после попадания HA');
  mount('hsin-suoming-shorekeeper');
  click('#loop');
  expect(labels()).toContain('Intro · Discernment');
  expect(labels()).not.toContain('Intro · смена персонажа');
 });
 for(const [scheme,normal,held] of [['pc','E','удерж. E'],['ps5','△','удерж. △'],['terms','Skill','Hold Skill']] as const){
  it('renders explicit Suoming tap, release hint and hold keycaps in '+scheme,()=>{
   mount('hsin-suoming-shorekeeper');click('#control-'+scheme);
   const tap=[...root().querySelectorAll<HTMLElement>('.action')].find(el=>el.querySelector('.action-label')?.textContent?.includes('Unforsaken Mind'))!;
   const hold=[...root().querySelectorAll<HTMLElement>('.action')].find(el=>el.querySelector('.action-label')?.textContent?.includes('Engraved Heart'))!;
   expect(tap.querySelector('.keycap')?.textContent).toBe(normal);
   expect(hold.querySelector('.keycap')?.textContent).toBe(held);
   expect(hold.querySelector('.action-hint')?.textContent).toContain('Отпусти кнопку');
   selectTab('Prydwen + Swap Cancel');
   const advHold=[...root().querySelectorAll<HTMLElement>('.action')].find(el=>el.querySelector('.action-label')?.textContent?.includes('Engraved Heart'))!;
   expect(advHold.querySelector('.keycap')?.textContent).toBe(held);
  });
 }
 it('displays condition/optional only on explicitly annotated Hsin actions',()=>{
  mount('hsin-suoming-shorekeeper');
  const ba=[...root().querySelectorAll<HTMLElement>('.action')].find(el=>el.querySelector('.action-label')?.textContent?.includes('BA3 → BA4'))!;
  expect(ba.classList.contains('optional-action')).toBe(true);
  expect(ba.querySelector('.action-optional')?.textContent).toBe('УСЛОВНО');
  expect(ba.querySelector('.action-condition')?.textContent).toContain('Forte < 100');
  const outro=[...root().querySelectorAll<HTMLElement>('.action')].find(el=>el.querySelector('.action-label')?.textContent?.includes('Unison Outro → Suoming'))!;
  expect(outro.querySelector('.action-optional')).toBeNull();
  selectTab('Prydwen + Swap Cancel');
  const extra=[...root().querySelectorAll<HTMLElement>('.action')].find(el=>el.querySelector('.action-label')?.textContent?.includes('Illumining (Swap Cancel!)'))!;
  expect(extra.querySelector('.action-condition')?.textContent).toContain('Swap Cancel');
  expect(extra.querySelector('.action-optional')?.textContent).toBe('УСЛОВНО');
 });
 it('warns about precisely flagged unverified repeat cycles near the selector',()=>{
  mount('hsin-suoming-shorekeeper');
  expect(element('.loop-warning').classList.contains('hidden')).toBe(true);
  click('#loop');
  expect(element('.loop-warning').textContent).toContain('Steady-loop Shorekeeper');
  selectTab('Prydwen + Swap Cancel');
  expect(element('.loop-warning').textContent).toContain('Swap Cancel');
  click('#opener');
  expect(element('.loop-warning').classList.contains('hidden')).toBe(true);
  mount('yyxl-suisui-chisa');click('#loop');
  expect(element('.loop-warning').classList.contains('hidden')).toBe(true);
  selectTab('2F');
  expect(element('.loop-warning').textContent).toContain('проверки');
  selectTab('2F QS');
  expect(element('.loop-warning').textContent).toContain('Quickswap');
 });

});


describe('Endfield Si: source-separated rotations and owned semantic actions',()=>{
 it('renders Maygi cold-start as three team phases with real operator owner labels',()=>{
  mount('si-tangtang-arcane-xaihi');
  expect(element('#opener').getAttribute('aria-pressed')).toBe('true');
  expect(stageNames()).toEqual(['Maygi · 1. Cryo → Corrosion','Maygi · 2. Второй пакет','Maygi · 3. Burst и Stagger']);
  expect(labels()).toContain('Arcane (WILL) · Скопировать Cryo через WILL Combo');
  expect(keycaps()).toContain('Combo');
  expect(keycaps()).toContain('Dive');
  expect(keycaps()).toContain('Finisher');
  expect(element('#route-source').getAttribute('href')).toContain('SI_TANGTANG_ARCANE_XAIHI_ROTATIONS.md');
 });
 it('maps Endfield operator-owned skills and Ultimates to PC position, without simulating a swap',()=>{
  mount('si-tangtang-arcane-xaihi');
  click('#control-pc');
  const cells=[...root().querySelectorAll<HTMLElement>('.action')];
  const arcaneSkill=cells.find(el=>el.querySelector('.action-label')?.textContent?.includes('Поглотить Cryo → Corrosion'))!;
  const siSkill=cells.find(el=>el.querySelector('.action-label')?.textContent?.includes('Открыть Artful Intent'))!;
  const xaihiUlt=cells.find(el=>el.querySelector('.action-label')?.textContent?.includes('Ultimate: Cryo Amp'))!;
  const arcaneCombo=cells.find(el=>el.querySelector('.action-label')?.textContent?.includes('Скопировать Cryo через WILL Combo'))!;
  expect(arcaneSkill.querySelector('.keycap')?.textContent).toBe('1');
  expect(siSkill.querySelector('.keycap')?.textContent).toBe('4');
  expect(xaihiUlt.querySelector('.keycap')?.textContent).toBe('удерж. 3');
  expect(arcaneCombo.querySelector('.keycap')?.textContent).toBe('E');
  expect(labels()).not.toContain('Swap → Arcane');
 });
 it('keeps Prydwen distinct, flags ambiguous second Tangtang Ultimate and avoids a fake loop',()=>{
  mount('si-tangtang-arcane-xaihi');
  selectTab('Prydwen');
  expect(stageNames()).toEqual(['Prydwen · 1. Первый Corrosion','Prydwen · 2. Второй Corrosion','Prydwen · 3. Stagger burst']);
  expect(labels()).toContain('Tangtang · Один Ultimate Tangtang (OLDEN STARE)');
  expect(labels().filter(x=>x.includes('Ultimate Tangtang'))).toHaveLength(1);
  expect(labels()).toContain('Tangtang · Final Strike под Crystal');
  click('#loop');
  expect(stageNames()).toEqual(['Повтор не верифицирован']);
  expect(element('.loop-warning').textContent).toContain('не является универсальным');
 });
});
