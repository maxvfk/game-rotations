// @vitest-environment jsdom
import {beforeEach,describe,it,expect} from 'vitest';
import {createPhysicalActionEffect} from '../src/physical-checkpoint-view';
import {mountRotation} from '../src/rotation';
import type {PhysicalCheckpoint} from '../src/rotation-types';
const base='/game-rotations/';
const url='https://endfield.wiki.gg/wiki/Physical_Status';
const before=(stacks:number|null,assessment:'target'|'unknown'|'observed'='target'):PhysicalCheckpoint=>({
 id:'test-before',subject:'primary-target',anchor:{actionIndex:0,relative:'before'},
 status:{kind:'vulnerability',stacks:stacks as 0|1|2|3|4|null,assessment},
 evidence:{basis:'tc-intent',url,note:'TEST fixture only, not a verified combat state'}
});
const after=(stacks:number|null):PhysicalCheckpoint=>({
 id:'test-after',subject:'primary-target',anchor:{actionIndex:0,relative:'after'},
 dependsOn:'test-before',status:{kind:'vulnerability',stacks:stacks as 0|1|2|3|4|null,assessment:'conditional'},
 condition:'TEST if the same target took a real physical effect',
 evidence:{basis:'live-mechanic',url,note:'TEST conditional snapshot, not observed'}
});
const event=(effect:'lift'|'knock-down'|'crush'|'breach'):PhysicalCheckpoint=>({
 id:'test-event',subject:'primary-target',anchor:{actionIndex:0,relative:'after'},
 status:{kind:'effect',effect,assessment:'conditional'},
 condition:'TEST only if that effect actually procs on the same target',
 evidence:{basis:'live-mechanic',url,note:'TEST event glyph is not a persistent debuff icon'}
});
beforeEach(()=>{document.body.innerHTML='<div id="app"></div>';localStorage.clear();HTMLElement.prototype.scrollIntoView=()=>{}});
describe('Endfield Physical checkpoint action UI (TEST-only snapshots)',()=>{
 it('renders known 3→0 Vulnerability with separate Crush EVENT on action 1',()=>{
  const root=createPhysicalActionEffect([before(3),after(0),event('crush')],0,base)!;
  expect(root.dataset.actionIndex).toBe('0');
  expect(root.querySelector('.physical-action-effect')?.getAttribute('data-kind')).toBe('transition');
  expect(root.querySelector('.physical-action-before img')?.getAttribute('src')).toContain('vulnerable-3.png');
  expect(root.querySelector('.physical-action-after .arts-empty-mark')?.textContent).toBe('—');
  expect(root.querySelector('.physical-action-event img')?.getAttribute('src')).toContain('crush.webp');
  expect(root.querySelector('.physical-action-event .arts-reaction-level')).toBeNull();
  expect(root.querySelector('.arts-action-arrow')?.textContent).toBe('→');
  expect(root.querySelector('.physical-action-event-separator')?.textContent).toBe('·');
  const desc=root.querySelector('.physical-action-effect')?.getAttribute('aria-label')||'';
  expect(desc).toContain('Действие 1');
  expect(desc).toContain('3 из 4');
  expect(desc).toContain('0 из 4');
  expect(desc).toContain('Физическое событие Crush, не длительный debuff');
  expect(desc).toContain('условно');
  expect(desc).toContain('TEST');
  expect(root.querySelector('.physical-action-visual')?.getAttribute('aria-hidden')).toBe('true');
 });
 it('supports event alone and unknown snapshot without pretending zero or adding false stacks',()=>{
  const onlyEvent=createPhysicalActionEffect([event('breach')],0,base)!;
  expect(onlyEvent.querySelectorAll('.physical-vulnerability')).toHaveLength(0);
  expect(onlyEvent.querySelector('.physical-action-event img')?.getAttribute('src')).toContain('breach.webp');
  const unknown=createPhysicalActionEffect([before(null,'unknown'),after(null),event('lift')],0,base)!;
  expect(unknown.querySelectorAll('.physical-vulnerability img')).toHaveLength(0);
  expect(unknown.querySelectorAll('.physical-vulnerability[data-stacks="unknown"]')).toHaveLength(2);
  expect(unknown.querySelector('.physical-action-event img')?.getAttribute('src')).toContain('lift.webp');
  const justBefore=createPhysicalActionEffect([before(2)],0,base)!;
  expect(justBefore.querySelector('.physical-action-event')).toBeNull();
  expect(justBefore.querySelector('.physical-action-before img')?.getAttribute('src')).toContain('vulnerable-2.png');
  expect(createPhysicalActionEffect(undefined,0,base)).toBeNull();
  expect(createPhysicalActionEffect([before(2)],2,base)).toBeNull();
 });
 it('preserves existing Si Arts and WuWa progress without any Physical data',()=>{
  const root=document.querySelector<HTMLDivElement>('#app')!;
  mountRotation(root,'si-tangtang-arcane-xaihi',base,base);
  expect(root.querySelector('#physical-visibility-toggle')).toBeNull();
  expect(root.querySelectorAll('.physical-action-annotations')).toHaveLength(0);
  expect(root.querySelectorAll('.arts-action-annotations')).toHaveLength(12);
  root.replaceChildren();root.className='';
  mountRotation(root,'yyxl-suisui-chisa',base,base);
  expect(root.querySelector('.progress-wrap')).not.toBeNull();
  expect(root.querySelector('#physical-visibility-toggle')).toBeNull();
  expect(root.querySelectorAll('.physical-action-annotations')).toHaveLength(0);
 });
});
