// @vitest-environment jsdom
import {beforeEach,describe,it,expect} from 'vitest';
import {createPhysicalVulnerability,createPhysicalEffect,PHYSICAL_EFFECTS,PHYSICAL_ICON_SIZES} from '../src/physical-indicators';
import {mountPhysicalGallery} from '../src/physical-gallery';
const base='/game-rotations/';
beforeEach(()=>{document.body.innerHTML='<div id="app"></div>'});
describe('Endfield Physical status originals (visual only)',()=>{
 it('renders source-pinned Vulnerability rings for every stack and size',()=>{
  expect(PHYSICAL_ICON_SIZES).toEqual([24,28,32]);
  for(const size of PHYSICAL_ICON_SIZES)for(const stacks of [1,2,3,4] as const){
   const icon=createPhysicalVulnerability({stacks,size,base});
   expect(icon.dataset.kind).toBe('vulnerability');
   expect(icon.getAttribute('aria-label')).toContain(stacks+'/4 стаков');
   expect(icon.querySelector('img')?.getAttribute('src')).toBe(base+'physical/arknights-endfield/vulnerability/vulnerable-'+stacks+'.png');
   expect(icon.querySelector('img')?.getAttribute('width')).toBe(String(size));
  }
 });
 it('never invents zero or unknown Vulnerability rings or levels',()=>{
  for(const stacks of [0,null] as const){
   const item=createPhysicalVulnerability({stacks,base});
   expect(item.querySelector('img')).toBeNull();
   expect(item.querySelector('.arts-empty-mark')?.textContent).toBe(stacks===0?'—':'?');
  }
  expect(()=>createPhysicalVulnerability({stacks:5 as never,base})).toThrow(RangeError);
  expect(()=>createPhysicalVulnerability({stacks:-1 as never,base})).toThrow(RangeError);
 });
 it('uses four different native WebP effect glyphs without fake status levels',()=>{
  expect(PHYSICAL_EFFECTS).toEqual(['lift','knock-down','crush','breach']);
  for(const effect of PHYSICAL_EFFECTS){
   const node=createPhysicalEffect({effect,size:32,base});
   expect(node.dataset.effect).toBe(effect);
   expect(node.querySelector('img')?.getAttribute('src')).toBe(base+'physical/arknights-endfield/effects/'+effect+'.webp');
   expect(node.querySelector('.arts-reaction-level')).toBeNull();
   expect(node.getAttribute('aria-label')).toContain(effect==='knock-down'?'Knock Down':effect==='lift'?'Lift':effect==='crush'?'Crush':'Breach');
  }
  expect(()=>createPhysicalEffect({effect:'unknown' as never,base})).toThrow();
 });
 it('degrades failed PNG/WebP to local neutral fallbacks',()=>{
  for(const icon of [createPhysicalVulnerability({stacks:4,base}),createPhysicalEffect({effect:'breach',base})]){
   icon.querySelector('img')!.dispatchEvent(new Event('error'));
   expect(icon.querySelector('img')).toBeNull();
   expect(icon.querySelector('.arts-indicator-fallback')?.textContent).toBe('?');
   expect(icon.classList.contains('arts-icon-unavailable')).toBe(true);
  }
 });
});
describe('Physical gallery selection does not assert combat results',()=>{
 it('shows 4 stack sprites plus 4 effect glyphs, sizes, and unknown/zero semantics',()=>{
  const root=document.querySelector('#app') as HTMLElement;mountPhysicalGallery(root,base);
  expect(root.querySelectorAll('.physical-stack-matrix .physical-vulnerability')).toHaveLength(4);
  expect(root.querySelectorAll('.physical-effect-matrix .physical-effect')).toHaveLength(4);
  expect(root.querySelector('.arts-notice')?.textContent).toContain('не вычисляются');
  root.querySelector<HTMLButtonElement>('[data-physical-size="32"]')!.click();
  expect(root.querySelector('.physical-effect-matrix img')?.getAttribute('width')).toBe('32');
  const change=(id:string,value:string)=>{const el=root.querySelector<HTMLSelectElement>('#'+id)!;el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}))};
  change('physical-stacks','2');change('physical-effect','breach');
  expect(root.querySelector('.physical-selected .physical-vulnerability img')?.getAttribute('src')).toContain('vulnerable-2.png');
  expect(root.querySelector('.physical-selected .physical-effect img')?.getAttribute('src')).toContain('breach.webp');
  change('physical-stacks','unknown');
  expect(root.querySelector('.physical-selected .physical-vulnerability img')).toBeNull();
  change('physical-stacks','0');
  expect(root.querySelector('.physical-selected .arts-empty-mark')?.textContent).toBe('—');
  expect(root.textContent).toContain('Shatter');
 });
});
