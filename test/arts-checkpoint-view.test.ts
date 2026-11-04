// @vitest-environment jsdom
import {beforeEach,describe,expect,it} from 'vitest';
import {createArtsCheckpointSummary} from '../src/arts-checkpoint-view';
import {hasRotation,mountRotation} from '../src/rotation';
import type {ArtsCheckpoint} from '../src/rotation-types';
import sourceBook from '../data/rotations/arknights-endfield/si-tangtang-arcane-xaihi.json';

const base='/game-rotations/';
const root=()=>document.querySelector<HTMLDivElement>('#app')!;
const click=(selector:string)=>root().querySelector<HTMLElement>(selector)!.click();
const selectVariant=(label:string)=>{
 const tab=[...root().querySelectorAll<HTMLButtonElement>('#tabs button')].find(x=>x.querySelector('strong')?.textContent===label);
 if(!tab)throw Error('Missing variant '+label);
 tab.click();
};
const mount=(id:string)=>{expect(hasRotation(id)).toBe(true);mountRotation(root(),id,base,base);};
beforeEach(()=>{
 document.body.innerHTML='<div id="app"></div>';
 localStorage.clear();
 HTMLElement.prototype.scrollIntoView=()=>{};
});

describe('Endfield semantic checkpoint presentation adapter',()=>{
 it('renders before/after as a SINGLE linked transition, with source-backed icons',()=>{
  const s=sourceBook.stages.prydwenOne;
  const summary=createArtsCheckpointSummary(s.artsCheckpoints as ArtsCheckpoint[],base)!;
  expect(summary.querySelectorAll('.arts-checkpoint-flow')).toHaveLength(1);
  const flow=summary.querySelector<HTMLElement>('.arts-checkpoint-flow')!;
  expect(flow.dataset.kind).toBe('transition');
  expect(flow.dataset.actionIndex).toBe('12');
  expect(flow.getAttribute('aria-label')).toContain('Действие 13');
  expect(flow.getAttribute('aria-label')).toContain('До: Cryo Infliction');
  expect(flow.getAttribute('aria-label')).toContain('После действия 13: Corrosion Reaction');
  expect(flow.getAttribute('aria-label')).toContain('цель, не наблюдение');
  expect(flow.getAttribute('aria-label')).toContain('условно');
  expect(flow.getAttribute('aria-label')).toContain('поглощены 4 Cryo');
  expect(flow.querySelectorAll('.arts-point')).toHaveLength(2);
  expect(flow.querySelector('.arts-point[data-relative="before"][data-assessment="target"]')).not.toBeNull();
  expect(flow.querySelector('.arts-point[data-relative="after"][data-assessment="conditional"]')).not.toBeNull();
  expect(flow.querySelector('.arts-point-assessment-target')?.textContent).toBe('цель');
  expect(flow.querySelector('.arts-point-assessment-conditional')?.textContent).toBe('если');
  expect(flow.querySelector('.arts-infliction img')?.getAttribute('src')).toBe(base+'arts/arknights-endfield/inflictions/cryo-4.png');
  expect(flow.querySelector('.arts-reaction img')?.getAttribute('src')).toBe(base+'arts/arknights-endfield/reactions/corrosion.png');
  expect(flow.querySelector('.arts-reaction-level')?.textContent).toBe('IV');
  expect(flow.querySelector('.arts-checkpoint-after .arts-checkpoint-arrow')?.textContent).toBe('→');
  expect(flow.querySelector('.arts-checkpoint-flow-visual')?.getAttribute('aria-hidden')).toBe('true');
  expect(flow.getAttribute('title')).toContain('Условие:');
  expect(flow.textContent).not.toContain('факт');
 });
 it('does not turn unknown into zero or silently invent confirmed values',()=>{
  const s=sourceBook.stages.maygiPrep;
  const summary=createArtsCheckpointSummary(s.artsCheckpoints as ArtsCheckpoint[],base)!;
  const flow=summary.querySelector('.arts-checkpoint-flow')!;
  expect(flow.querySelector('.arts-infliction img')).toBeNull();
  expect(flow.querySelector('.arts-empty-mark')?.textContent).toBe('?');
  expect(flow.querySelector('.arts-infliction')?.getAttribute('data-stacks')).toBe('unknown');
  expect(flow.querySelector('.arts-reaction-level')?.textContent).toBe('?');
  expect(flow.querySelector('.arts-point-assessment-unknown')?.textContent).toBe('неизв.');
  expect(flow.getAttribute('aria-label')).toContain('стаки неизвестно');
  expect(flow.getAttribute('aria-label')).toContain('уровень неизвестен');
  expect(flow.getAttribute('aria-label')).toContain('Если в момент попадания');
 });
 it('keeps other reaction types and future icon presentation interchangeable',()=>{
  const original=sourceBook.stages.prydwenOne.artsCheckpoints as ArtsCheckpoint[];
  const custom=structuredClone(original);
  if(custom[0].status.kind!=='infliction'||custom[1].status.kind!=='reaction')throw Error('test data mismatched');
  custom[0].status.element='heat';
  custom[0].status.stacks=2;
  custom[1].status.reaction='combustion';
  custom[1].status.level=2;
  const summary=createArtsCheckpointSummary(custom,base)!;
  expect(summary.querySelector('.arts-infliction img')?.getAttribute('src')).toContain('/heat-2.png');
  expect(summary.querySelector('.arts-reaction img')?.getAttribute('src')).toContain('/combustion.png');
  expect(summary.querySelector('.arts-reaction-level')?.textContent).toBe('II');
  // Rotation data contains only semantic checkpoints, never a filename or Roman level.
  expect(JSON.stringify(custom)).not.toMatch(/\.(png|svg|webp)|iconPath|romanText/);
  expect(createArtsCheckpointSummary(undefined,base)).toBeNull();
  expect(createArtsCheckpointSummary([],base)).toBeNull();
 });
});

describe('Endfield rotation integration',()=>{
 it('adds compact badges to 3 Maygi / 3 Prydwen stages but not unverified recovery',()=>{
  mount('si-tangtang-arcane-xaihi');
  expect(root().querySelectorAll('.stage-arts-summary')).toHaveLength(3);
  expect(root().querySelectorAll('.stage-compact-line')).toHaveLength(3);
  expect(root().querySelectorAll('.stage-compact-row')).toHaveLength(3);
  expect(root().querySelectorAll('.stage-arts-summary .arts-checkpoint-flow')).toHaveLength(3);
  for(const s of root().querySelectorAll('.stage-arts-summary')){
   expect(s.querySelectorAll('.arts-point')).toHaveLength(2);
  }
  click('#layout-compact');
  expect(root().classList.contains('compact-actions')).toBe(true);
  expect(root().querySelector('.stage-compact-line')?.textContent).toContain('01 / 03');
  expect(root().querySelectorAll('.stage .complete')).toHaveLength(0);
  selectVariant('Prydwen');
  expect(root().querySelectorAll('.stage-arts-summary')).toHaveLength(3);
  expect(root().querySelector('.stage-arts-summary .arts-infliction img')?.getAttribute('src')).toContain('/cryo-4.png');
  expect(root().querySelector('.stage-arts-summary .arts-reaction-level')?.textContent).toBe('IV');
  click('#loop');
  expect(root().querySelectorAll('.stage')).toHaveLength(1);
  expect(root().querySelectorAll('.stage-arts-summary')).toHaveLength(0);
  click('#opener');
  expect(root().querySelectorAll('.stage-arts-summary')).toHaveLength(3);
 });
 it('does not alter WuWa rotation headers, progress or controls',()=>{
  mount('yyxl-suisui-chisa');
  expect(root().querySelectorAll('.stage-arts-summary')).toHaveLength(0);
  expect(root().querySelectorAll('.stage-compact-row')).toHaveLength(0);
  expect(root().querySelectorAll('.stage .complete')).toHaveLength(3);
  expect(root().querySelector('.progress-wrap')).not.toBeNull();
  expect(root().querySelector('#layout-compact')).toBeNull();
 });
});
