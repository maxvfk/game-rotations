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
 await expect(page.locator('.action.arts-annotated')).toHaveCount(3);
 await expect(page.locator('.stage-title').first()).toBeVisible();
 await page.locator('#layout-compact').click();
 await expect(page.locator('.stage-compact-line').first()).toBeVisible();
 const maygi=page.locator('.action.arts-annotated').first();
 await expect(maygi.locator('.keycap')).toHaveText('Skill');
 await expect(maygi.locator('.arts-action-effect')).toBeVisible();
 await expect(maygi.locator('.arts-action-pre-word')).toHaveText('при Cryo');
 await expect(maygi.locator('.arts-action-result-name')).toHaveText('Corrosion');
 await expect(maygi.locator('.arts-conditional')).toHaveText('если');
 await expect(maygi.locator('.arts-action-result .arts-reaction')).toHaveAttribute('data-level','unknown');
 await expect(maygi.locator('.arts-action-result .arts-reaction-level')).toBeHidden();
 await expect(maygi.locator('.arts-infliction')).toHaveCount(0);
 await expect(maygi.locator('.arts-action-effect')).toHaveAttribute('aria-label',/уровень неизвестен/);
 await expect(maygi).toHaveAttribute('title',/ожидаемое изменение состояния основной цели/);
 await expect(maygi).toHaveAttribute('title',/точный Status Level неизвестен/);
 await noOverflow(page);
 await page.screenshot({path:testInfo.outputPath('endfield-arts-action-maygi-mobile.png'),fullPage:true,animations:'disabled'});

 await page.locator('#tabs button').filter({has:page.locator('strong',{hasText:'Prydwen'})}).first().click();
 await expect(page.locator('.action.arts-annotated')).toHaveCount(3);
 const prydwen=page.locator('.action.arts-annotated').first();
 await expect(prydwen.locator('.keycap')).toHaveText('Skill');
 await expect(prydwen.locator('.arts-infliction')).toHaveAttribute('data-stacks','4');
 await expect(prydwen.locator('.arts-infliction img')).toHaveAttribute('src',/inflictions\/cryo-4\.png$/);
 await expect(prydwen.locator('.arts-target')).toHaveText('цель');
 await expect(prydwen.locator('.arts-action-result .arts-reaction img')).toHaveAttribute('src',/reactions\/corrosion\.png$/);
 await expect(prydwen.locator('.arts-reaction-level')).toHaveText('IV');
 await expect(prydwen.locator('.arts-conditional')).toHaveText('если');
 await expect(prydwen.locator('.arts-action-effect')).toHaveAttribute('aria-label',/цель TC, не наблюдение/);
 await expect(prydwen.locator('.arts-action-effect')).toHaveAttribute('aria-label',/только при выполнении условий/);
 const original=prydwen.locator('.arts-infliction img');
 await original.scrollIntoViewIfNeeded();
 await expect.poll(()=>original.evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBe(125);
 await noOverflow(page);
 await page.screenshot({path:testInfo.outputPath('endfield-arts-action-prydwen-mobile.png'),fullPage:true,animations:'disabled'});

 // Input labels are independent of Arts: in the PC scheme Skill becomes E.
 await page.locator('#control-pc').click();
 await expect(page.locator('.action.arts-annotated').first().locator('.keycap')).toHaveText('E');
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
 await expect(page.locator('.action.arts-annotated').first().locator('.arts-action-effect')).toBeVisible();
 expect(await page.locator('.sequence .keycap').allTextContents()).toEqual(actions);
 await page.locator('#layout-compact').click();
 await page.locator('#loop').click();
 await expect(page.locator('.stage')).toHaveCount(1);
 await expect(page.locator('.action.arts-annotated')).toHaveCount(0);
 await page.locator('#opener').click();
 await expect(page.locator('.action.arts-annotated')).toHaveCount(3);
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
 await expect(page.locator('.action.arts-annotated')).toHaveCount(3);
 const offline=page.locator('.action.arts-annotated .arts-infliction img').first();
 await offline.scrollIntoViewIfNeeded();
 await expect.poll(()=>offline.evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBe(125);
 const reaction=page.locator('.action.arts-annotated .arts-reaction img').first();
 await reaction.scrollIntoViewIfNeeded();
 await expect.poll(()=>reaction.evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBe(72);
 await context.setOffline(false);
 await page.goto('?team=yyxl-suisui-chisa');
 await expect(page.locator('.arts-action-annotations')).toHaveCount(0);
 await expect(page.locator('.progress-wrap')).toBeVisible();
 await expect(page.locator('.stage .complete')).toHaveCount(3);
 expect(errors).toEqual([]);
});
