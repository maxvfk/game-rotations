import {test,expect} from '@playwright/test';
const si='?team=si-tangtang-arcane-xaihi';
const noOverflow=async(page:import('@playwright/test').Page)=>{
 const excess=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 expect(excess).toBeLessThanOrEqual(1);
};

test('Endfield: local Arts outcomes after Arcane Skill, not stage headers',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(si);
 await expect(page.locator('.stage')).toHaveCount(3);
 await expect(page.locator('.stage-arts-summary')).toHaveCount(0);
 await expect(page.locator('.action.arts-annotated')).toHaveCount(12);
 await expect(page.locator('.stage').nth(0).locator('.action.arts-annotated')).toHaveCount(5);
 await expect(page.locator('.stage').nth(1).locator('.action.arts-annotated')).toHaveCount(3);
 await expect(page.locator('.stage').nth(2).locator('.action.arts-annotated')).toHaveCount(4);
 await expect(page.locator('.stage-title').first()).toBeVisible();
 await page.locator('#layout-compact').click();
 await expect(page.locator('.stage-compact-line').first()).toBeVisible();
 const maygi=page.locator('.action.arts-annotated').first();
 await expect(maygi.locator('.keycap')).toHaveText('Skill');
 await expect(maygi.locator('.arts-action-effect')).toBeVisible();
 await expect(maygi.locator('.arts-action-result .arts-infliction')).toHaveAttribute('data-stacks','1');
 await expect(maygi.locator('.arts-action-prerequisite .arts-infliction')).toHaveAttribute('data-stacks','0');
 await expect(maygi.locator('.action-primary > .arts-action-annotations')).toHaveCount(1);
 await expect(maygi.locator(':scope > .arts-action-annotations')).toHaveCount(0);
 const maygiCopy=page.locator('.action.arts-annotated').nth(1);
 await expect(maygiCopy.locator('.arts-action-prerequisite .arts-infliction')).toHaveAttribute('data-stacks','1');
 await expect(maygiCopy.locator('.arts-action-result .arts-infliction')).toHaveAttribute('data-stacks','2');
 const maygiCorrosion=page.locator('.action.arts-annotated').nth(4);
 await expect(maygiCorrosion.locator('.keycap')).toHaveText('Skill');
 await expect(maygiCorrosion.locator('.arts-infliction')).toHaveAttribute('data-stacks','4');
 await expect(maygiCorrosion.locator('.arts-reaction')).toHaveAttribute('data-level','4');
 await expect(maygiCorrosion.locator('.arts-action-effect')).toHaveAttribute('aria-label',/только при выполнении условий/);
 const maygiSecondCorrosion=page.locator('.stage').nth(1).locator('.action.arts-annotated').last();
 await expect(maygiSecondCorrosion.locator('.arts-infliction')).toHaveAttribute('data-stacks','2');
 await expect(maygiSecondCorrosion.locator('.arts-reaction')).toHaveAttribute('data-level','unknown');
 await expect(maygiSecondCorrosion.locator('.arts-reaction-level')).toBeHidden();
 await expect(maygiSecondCorrosion.locator('.arts-action-effect')).toHaveAttribute('aria-label',/уровень неизвестен/);
 await noOverflow(page);
 await page.screenshot({path:testInfo.outputPath('endfield-arts-action-maygi-mobile.png'),fullPage:true,animations:'disabled'});

 await page.locator('#tabs button').filter({has:page.locator('strong',{hasText:'Prydwen'})}).first().click();
 await expect(page.locator('.action.arts-annotated')).toHaveCount(15);
 const opener=page.locator('.action.arts-annotated').first();
 await expect(opener.locator('.arts-action-result .arts-infliction')).toHaveAttribute('data-stacks','1');
 const firstCopy=page.locator('.action.arts-annotated').nth(1);
 await expect(firstCopy.locator('.arts-action-prerequisite .arts-infliction')).toHaveAttribute('data-stacks','1');
 await expect(firstCopy.locator('.arts-action-result .arts-infliction')).toHaveAttribute('data-stacks','2');
 const prydwen=page.locator('.action.arts-annotated').nth(4);
 await expect(prydwen.locator('.keycap')).toHaveText('Skill');
 await expect(prydwen.locator('.arts-infliction')).toHaveAttribute('data-stacks','4');
 await expect(prydwen.locator('.arts-infliction img')).toHaveAttribute('src',/inflictions\/cryo-4\.png$/);
 await expect(prydwen.locator('.arts-target')).toHaveCount(0);
 await expect(prydwen.locator('.action-primary > .arts-action-annotations')).toHaveCount(1);
 await expect(prydwen.locator('.arts-action-result .arts-reaction img')).toHaveAttribute('src',/reactions\/corrosion\.png$/);
 await expect(prydwen.locator('.arts-reaction-level')).toHaveText('IV');
 await expect(prydwen.locator('.arts-reaction')).toHaveClass(/arts-reaction-level-overlay/);
 await expect(prydwen.locator('.arts-reaction-level')).toHaveCSS('position','absolute');
 await expect(prydwen.locator('.arts-conditional')).toHaveCount(0);
 await expect(prydwen.locator('.arts-action-pre-word')).toHaveCount(0);
 await expect(prydwen.locator('.arts-action-result-name')).toHaveCount(0);
 await expect(prydwen.locator('.arts-action-effect')).toHaveAttribute('aria-label',/цель TC, не наблюдение/);
 await expect(prydwen.locator('.arts-action-effect')).toHaveAttribute('aria-label',/только при выполнении условий/);
 const original=prydwen.locator('.arts-infliction img');
 await original.scrollIntoViewIfNeeded();
 await expect.poll(()=>original.evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBe(125);
 const line=prydwen.locator('.action-primary');
 const firstBox=await line.locator('.keycap').boundingBox();
 const artsBox=await line.locator('.arts-action-annotations').boundingBox();
 expect(firstBox).not.toBeNull();expect(artsBox).not.toBeNull();
 expect(Math.abs((firstBox!.y+firstBox!.height/2)-(artsBox!.y+artsBox!.height/2))).toBeLessThanOrEqual(3);
 await noOverflow(page);
 await page.screenshot({path:testInfo.outputPath('endfield-arts-action-prydwen-mobile.png'),fullPage:true,animations:'disabled'});

 // The PC binding is actor-specific: the Arcane action is mapped to 1 here,
 // not a universal E key. Switching schemes must not change the Arts annotation.
 await page.locator('#control-pc').click();
 await expect(page.locator('.action.arts-annotated').first().locator('.keycap')).toHaveText('4');
 await expect(page.locator('.action.arts-annotated').nth(4).locator('.keycap')).toHaveText('1');
 await page.locator('#control-terms').click();
 await expect(page.locator('.action.arts-annotated').first().locator('.keycap')).toHaveText('Skill');
 await page.setViewportSize({width:320,height:740});
 await noOverflow(page);
 await expect(prydwen.locator('.arts-action-effect')).toBeVisible();
 const box=await prydwen.boundingBox();
 expect(box).not.toBeNull();
 expect(box!.x+box!.width).toBeLessThanOrEqual(321);
 await page.screenshot({path:testInfo.outputPath('endfield-arts-action-320px.png'),fullPage:true,animations:'disabled'});

 // Full view retains detailed descriptions and keeps Arts attached to the action.
 const actions=await page.locator('.sequence .keycap').allTextContents();
 await page.locator('#layout-full').click();
 await expect(page.locator('.stage-title').first()).toBeVisible();
 await expect(page.locator('.stage-compact-row').first()).toBeHidden();
 await expect(page.locator('.action.arts-annotated').first().locator('.action-primary > .arts-action-annotations')).toBeVisible();
 expect(await page.locator('.sequence .keycap').allTextContents()).toEqual(actions);
 await page.locator('#layout-compact').click();
 await page.locator('#loop').click();
 await expect(page.locator('.stage')).toHaveCount(1);
 await expect(page.locator('.action.arts-annotated')).toHaveCount(0);
 await page.locator('#opener').click();
 await expect(page.locator('.action.arts-annotated')).toHaveCount(15);
 expect(errors).toEqual([]);
});

test('Action-local Arts survive PWA offline, while WuWa stays isolated',async({page,context})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(si);
 await page.locator('#layout-compact').click();
 await page.locator('#tabs button').filter({has:page.locator('strong',{hasText:'Prydwen'})}).first().click();
 const icon=page.locator('.action.arts-annotated .arts-infliction img').first();
 await icon.scrollIntoViewIfNeeded();
 await expect.poll(()=>icon.evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBe(125);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready});
 await page.reload();
 await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('.action.arts-annotated')).toHaveCount(15);
 const offline=page.locator('.action.arts-annotated .arts-infliction img').first();
 await offline.scrollIntoViewIfNeeded();
 await expect.poll(()=>offline.evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBe(125);
 const reaction=page.locator('.action.arts-annotated .arts-reaction img').first();
 await reaction.scrollIntoViewIfNeeded();
 await expect.poll(()=>reaction.evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBe(72);
 // The switch must work without network and survive an offline PWA reload.
 await page.locator('#arts-visibility-toggle').click();
 await expect(page.locator('.arts-action-annotations')).toHaveCount(0);
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('#arts-visibility-toggle')).toHaveAttribute('aria-pressed','false');
 await expect(page.locator('.arts-action-annotations')).toHaveCount(0);
 await page.locator('#arts-visibility-toggle').click();
 await expect(page.locator('.arts-action-annotations')).toHaveCount(15);
 await context.setOffline(false);
 await page.goto('?team=yyxl-suisui-chisa');
 await expect(page.locator('#arts-visibility-toggle')).toHaveCount(0);
 await expect(page.locator('.arts-action-annotations')).toHaveCount(0);
 await expect(page.locator('.progress-wrap')).toBeVisible();
 await expect(page.locator('.stage .complete')).toHaveCount(3);
 expect(errors).toEqual([]);
});

test('Endfield: Arts switch hides annotations and persists across variants, layout and reload',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(si);
 const toggle=page.locator('#arts-visibility-toggle');
 await expect(toggle).toHaveText('Arts: вкл');
 await expect(toggle).toHaveAttribute('aria-label','Показывать Arts-индикаторы');
 await expect(toggle).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.action.arts-annotated')).toHaveCount(12); // Maygi action-local effects

 // Hiding must remove annotation nodes and extended tooltips/ARIA, not just PNG visibility.
 await toggle.click();
 await expect(toggle).toHaveText('Arts: выкл');
 await expect(toggle).toHaveAttribute('aria-pressed','false');
 await expect(page.locator('.arts-action-annotations,.arts-action-effect,.action.arts-annotated')).toHaveCount(0);
 await expect(page.locator('.action.endfield-action[title*="ожидаемое изменение состояния"]')).toHaveCount(0);
 await page.screenshot({path:testInfo.outputPath('endfield-arts-toggle-off-390px.png'),fullPage:true,animations:'disabled'});
 expect(await page.evaluate(()=>localStorage.getItem('game-rotations:v2:si-tangtang-arcane-xaihi:artsVisible'))).toBe('false');

 await page.locator('#layout-compact').click();
 await expect(page.locator('.arts-action-annotations')).toHaveCount(0);
 await page.locator('#tabs button').filter({has:page.locator('strong',{hasText:'Prydwen'})}).first().click();
 await expect(page.locator('.arts-action-annotations')).toHaveCount(0);
 await page.locator('#control-pc').click();
 await expect(page.locator('.arts-action-annotations')).toHaveCount(0);
 await page.locator('#layout-full').click();
 await expect(page.locator('.arts-action-annotations')).toHaveCount(0);
 await page.locator('#layout-compact').click();
 await page.reload();
 await expect(toggle).toHaveAttribute('aria-pressed','false');
 await expect(page.locator('.arts-action-annotations')).toHaveCount(0);

 await toggle.click();
 await expect(toggle).toHaveText('Arts: вкл');
 await expect(page.locator('.action.arts-annotated')).toHaveCount(15);
 await expect(page.locator('.arts-action-annotations')).toHaveCount(15);
 await expect(page.locator('.arts-reaction-level')).toHaveText(['IV','IV','IV']);
 await page.screenshot({path:testInfo.outputPath('endfield-arts-toggle-on-390px.png'),fullPage:true,animations:'disabled'});
 await page.setViewportSize({width:320,height:740});
 await noOverflow(page);
 await page.locator('#loop').click();
 await expect(page.locator('.action.arts-annotated')).toHaveCount(0);
 await page.locator('#opener').click();
 await expect(page.locator('.action.arts-annotated')).toHaveCount(15);
 await page.reload();
 await expect(toggle).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.action.arts-annotated')).toHaveCount(15);
 expect(errors).toEqual([]);
});
