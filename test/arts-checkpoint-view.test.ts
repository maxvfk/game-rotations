// @vitest-environment jsdom
import {beforeEach,describe,expect,it} from 'vitest';
import {createArtsActionEffect} from '../src/arts-checkpoint-view';
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
beforeEach(()=>{
 document.body.innerHTML='<div id="app"></div>';
 localStorage.clear();
 HTMLElement.prototype.scrollIntoView=()=>{};
});

describe('Endfield action-local Arts changes',()=>{
 it('anchors a numeric target and conditional result to Arcane Skill, never the stage header',()=>{
  const s=sourceBook.stages.prydwenOne;
  expect(createArtsActionEffect(s.artsCheckpoints as ArtsCheckpoint[],0,base)).toBeNull();
  const result=createArtsActionEffect(s.artsCheckpoints as ArtsCheckpoint[],12,base)!;
  expect(result.dataset.actionIndex).toBe('12');
  expect(result.querySelectorAll('.arts-action-effect')).toHaveLength(1);
  const effect=result.querySelector<HTMLElement>('.arts-action-effect')!;
  expect(effect.dataset.kind).toBe('transition');
  expect(effect.getAttribute('aria-label')).toContain('Действие 13');
  expect(effect.getAttribute('aria-label')).toContain('Перед действием: Cryo Infliction');
  expect(effect.getAttribute('aria-label')).toContain('После действия: Corrosion Reaction');
  expect(effect.getAttribute('aria-label')).toContain('цель TC, не наблюдение');
  expect(effect.getAttribute('aria-label')).toContain('только при выполнении условий');
  expect(effect.getAttribute('title')).toContain('поглощены 4 Cryo');
  expect(effect.querySelector('.arts-infliction img')?.getAttribute('src')).toBe(base+'arts/arknights-endfield/inflictions/cryo-4.png');
  expect(effect.querySelector('.arts-reaction img')?.getAttribute('src')).toBe(base+'arts/arknights-endfield/reactions/corrosion.png');
  expect(effect.querySelector('.arts-reaction-level')?.textContent).toBe('IV');
  expect(effect.querySelector('.arts-target')).toBeNull();
  expect(effect.querySelector('.arts-conditional')).toBeNull();
  expect(effect.textContent).not.toContain('цель');
  expect(effect.textContent).not.toContain('если');
  expect(effect.querySelector('.arts-action-arrow')?.textContent).toBe('→');
  expect(effect.querySelector('.arts-action-visual')?.getAttribute('aria-hidden')).toBe('true');
 });
 it('hides unknown NUMBERS visually but explains the conditional reaction',()=>{
  const s=sourceBook.stages.maygiPrep;
  const result=createArtsActionEffect(s.artsCheckpoints as ArtsCheckpoint[],9,base)!;
  const effect=result.querySelector<HTMLElement>('.arts-action-effect')!;
  expect(effect.textContent).toContain('Cryo');
  expect(effect.querySelector('.arts-action-result .arts-reaction img')).not.toBeNull();
  expect(effect.textContent).not.toContain('если');
  expect(effect.querySelector('.arts-infliction img')).toBeNull();
  expect(effect.querySelector('.arts-reaction img')).not.toBeNull();
  expect(effect.querySelector('.arts-reaction')?.getAttribute('data-level')).toBe('unknown');
  expect(effect.querySelector('.arts-action-qualifier.arts-target')).toBeNull();
  expect(effect.getAttribute('title')).toContain('уровень неизвестен');
  expect(effect.getAttribute('title')).toContain('точный Status Level неизвестен');
  expect(effect.textContent).not.toContain('?');
 });
 it('works with future elements without changing the icon catalog or checkpoints',()=>{
  const custom=structuredClone(sourceBook.stages.prydwenOne.artsCheckpoints) as ArtsCheckpoint[];
  if(custom[0].status.kind!=='infliction'||custom[1].status.kind!=='reaction')throw Error('bad fixture');
  custom[0].status.element='heat';custom[0].status.stacks=2;
  custom[1].status.reaction='combustion';custom[1].status.level=2;
  const result=createArtsActionEffect(custom,12,base)!;
  expect(result.querySelector('.arts-infliction img')?.getAttribute('src')).toContain('/heat-2.png');
  expect(result.querySelector('.arts-reaction img')?.getAttribute('src')).toContain('/combustion.png');
  expect(result.querySelector('.arts-reaction-level')?.textContent).toBe('II');
  expect(JSON.stringify(custom)).not.toMatch(/\.(png|svg|webp)|iconPath|romanText/);
  expect(createArtsActionEffect([],12,base)).toBeNull();
  expect(createArtsActionEffect(undefined,12,base)).toBeNull();
 });
});
describe('Endfield rotation integration',()=>{
 it('shows annotations only on Arcane Skill in three Maygi and Prydwen stages',()=>{
  expect(hasRotation('si-tangtang-arcane-xaihi')).toBe(true);
  mountRotation(root(),'si-tangtang-arcane-xaihi',base,base);
  expect(root().querySelectorAll('.stage-arts-summary')).toHaveLength(0);
  expect(root().querySelectorAll('.stage-compact-row')).toHaveLength(3);
  expect(root().querySelectorAll('.action.arts-annotated')).toHaveLength(3);
  for(const stage of root().querySelectorAll('.stage')){
   expect(stage.querySelectorAll('.action.arts-annotated')).toHaveLength(1);
   expect(stage.querySelector('.arts-action-effect')?.getAttribute('title')).toContain('Действие');
   expect(stage.querySelector('.action.arts-annotated > .arts-action-annotations')).toBeNull();
   expect(stage.querySelector('.action.arts-annotated .action-primary > .arts-action-annotations')).not.toBeNull();
  }
  click('#layout-compact');
  expect(root().classList.contains('compact-actions')).toBe(true);
  expect(root().querySelector('.stage-compact-line')?.textContent).toContain('01 / 03');
  selectVariant('Prydwen');
  expect(root().querySelectorAll('.action.arts-annotated')).toHaveLength(3);
  const first=root().querySelector('.action.arts-annotated')!;
  expect(first.querySelector('.arts-infliction img')?.getAttribute('src')).toContain('/cryo-4.png');
  expect(first.querySelector('.arts-reaction-level')?.textContent).toBe('IV');
  expect(first.getAttribute('title')).toContain('Действие 13');
  expect(first.querySelector('.arts-action-visual')?.textContent).not.toContain('если');
  expect(first.querySelector('.arts-action-visual')?.textContent).not.toContain('цель');
  click('#loop');
  expect(root().querySelectorAll('.stage')).toHaveLength(1);
  expect(root().querySelectorAll('.action.arts-annotated')).toHaveLength(0);
  click('#opener');
  expect(root().querySelectorAll('.action.arts-annotated')).toHaveLength(3);
 });
 it('keeps WuWa and its progress controls unchanged',()=>{
  mountRotation(root(),'yyxl-suisui-chisa',base,base);
  expect(root().querySelectorAll('.arts-action-annotations')).toHaveLength(0);
  expect(root().querySelectorAll('.stage-compact-row')).toHaveLength(0);
  expect(root().querySelectorAll('.stage .complete')).toHaveLength(3);
  expect(root().querySelector('.progress-wrap')).not.toBeNull();
  expect(root().querySelector('#layout-compact')).toBeNull();
 });
});
