// @vitest-environment jsdom
import {beforeEach,describe,expect,it} from 'vitest';
import {ARTS_ELEMENTS,ARTS_REACTIONS,ARTS_SIZES,createArtsInfliction,createArtsReaction} from '../src/arts-indicators';
import {mountArtsGallery} from '../src/arts-gallery';

const base='/game-rotations/';
beforeEach(()=>{document.body.innerHTML='<div id="app"></div>'});

describe('Endfield Arts status indicator (visual only, source-pinned PNG)',()=>{
 it('covers all four original Infliction stack sprites per element at exact 24,28,32 CSS pixels',()=>{
  expect(ARTS_ELEMENTS).toHaveLength(4);
  expect(ARTS_SIZES).toEqual([24,28,32]);
  for(const element of ARTS_ELEMENTS){
   for(const size of ARTS_SIZES){
    for(const stacks of [1,2,3,4] as const){
     const icon=createArtsInfliction({element,stacks,size,base});
     expect(icon.dataset.kind).toBe('infliction');
     expect(icon.dataset.stacks).toBe(String(stacks));
     expect(icon.style.getPropertyValue('--arts-icon-size')).toBe(size+'px');
     expect(icon.getAttribute('aria-label')).toContain(stacks+'/4 стаков');
     const img=icon.querySelector('img')!;
     expect(img.getAttribute('src')).toBe(base+'arts/arknights-endfield/inflictions/'+element+'-'+stacks+'.png');
     expect(img.getAttribute('width')).toBe(String(size));
     expect(img.getAttribute('height')).toBe(String(size));
     expect(img.getAttribute('alt')).toBe('');
     expect(img.getAttribute('aria-hidden')).toBe('true');
    }
   }
  }
 });
 it('never invents a zero-stack or unknown-stack image; invalid amounts fail closed',()=>{
  for(const stacks of [0,null] as const){
   const icon=createArtsInfliction({element:'cryo',stacks,base});
   expect(icon.querySelector('img')).toBeNull();
   expect(icon.querySelector('.arts-empty-mark')?.textContent).toBe(stacks===0?'—':'?');
   expect(icon.getAttribute('aria-label')).toContain(stacks===0?'0/4':'неизвестно');
  }
  expect(()=>createArtsInfliction({element:'cryo',stacks:5 as never,base})).toThrow(RangeError);
  expect(()=>createArtsInfliction({element:'cryo',stacks:-1 as never,base})).toThrow(RangeError);
 });
 it('renders each reaction with independent Roman I-IV and a clear unknown state',()=>{
  expect(ARTS_REACTIONS).toHaveLength(4);
  for(const reaction of ARTS_REACTIONS){
   for(const [level,roman] of [[1,'I'],[2,'II'],[3,'III'],[4,'IV']] as const){
    const icon=createArtsReaction({reaction,level,size:32,base});
    expect(icon.querySelector('img')?.getAttribute('src')).toBe(base+'arts/arknights-endfield/reactions/'+reaction+'.png');
    expect(icon.querySelector('.arts-reaction-level')?.textContent).toBe(roman);
    expect(icon.dataset.level).toBe(String(level));
    expect(icon.getAttribute('aria-label')).toContain('уровень '+roman);
   }
  }
  const missing=createArtsReaction({reaction:'corrosion',level:null,base});
  expect(missing.querySelector('.arts-reaction-level')?.textContent).toBe('?');
  expect(missing.getAttribute('aria-label')).toContain('уровень неизвестен');
  expect(()=>createArtsReaction({reaction:'corrosion',level:0 as never,base})).toThrow(RangeError);
  expect(()=>createArtsReaction({reaction:'corrosion',level:5 as never,base})).toThrow(RangeError);
 });
 it('replaces broken local PNG with a fallback marker, not an external image',()=>{
  for(const icon of [createArtsInfliction({element:'nature',stacks:4,base}),
   createArtsReaction({reaction:'electrification',level:2,base})]){
   icon.querySelector('img')!.dispatchEvent(new Event('error'));
   expect(icon.querySelector('img')).toBeNull();
   expect(icon.querySelector('.arts-indicator-fallback')?.textContent).toBe('?');
   expect(icon.classList.contains('arts-icon-unavailable')).toBe(true);
  }
 });
});
describe('Endfield Arts gallery navigation and interactive selection',()=>{
 it('shows all 16 stack PNGs and all 4 reactions × 4 levels without claiming actual rotation states',()=>{
  const root=document.querySelector('#app') as HTMLElement;
  mountArtsGallery(root,base);
  expect(root.classList.contains('arts-preview-root')).toBe(true);
  expect(root.querySelectorAll('.arts-stack-matrix .arts-infliction')).toHaveLength(16);
  expect(root.querySelectorAll('.arts-reaction-matrix .arts-reaction')).toHaveLength(16);
  expect(root.textContent).toContain('Демонстрация отображения');
  expect(root.querySelector('.arts-back')?.getAttribute('href')).toBe(base);
  expect(root.querySelector('.arts-selected .arts-infliction')?.getAttribute('aria-label')).toContain('Cryo');
  expect(root.querySelector('.arts-selected .arts-reaction')?.getAttribute('aria-label')).toContain('Corrosion');
  const size32=root.querySelector<HTMLButtonElement>('[data-size="32"]')!;
  size32.click();
  expect(size32.getAttribute('aria-pressed')).toBe('true');
  expect(root.querySelector('.arts-stack-matrix img')?.getAttribute('width')).toBe('32');
  const select=(id:string,value:string)=>{const el=root.querySelector<HTMLSelectElement>('#'+id)!;el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}))};
  select('arts-element','electric');
  select('arts-stacks','2');
  select('arts-reaction','solidification');
  select('arts-level','3');
  expect(root.querySelector('.arts-selected .arts-infliction img')?.getAttribute('src')).toContain('/electric-2.png');
  expect(root.querySelector('.arts-selected .arts-reaction img')?.getAttribute('src')).toContain('/solidification.png');
  expect(root.querySelector('.arts-selected .arts-reaction-level')?.textContent).toBe('III');
  select('arts-stacks','unknown');
  select('arts-level','unknown');
  expect(root.querySelector('.arts-selected .arts-infliction img')).toBeNull();
  expect(root.querySelector('.arts-selected .arts-reaction-level')?.textContent).toBe('?');
  expect(root.querySelectorAll('.arts-stack-matrix .arts-infliction')).toHaveLength(16);
 });
});
