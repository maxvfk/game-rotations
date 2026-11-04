import {test,expect} from '@playwright/test';

const si='?team=si-tangtang-arcane-xaihi';
const noOverflow=async(page:import('@playwright/test').Page)=>{
 const excess=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 expect(excess).toBeLessThanOrEqual(1);
};

test('Endfield Arts checkpoints: Maygi/Prydwen after titles, target vs conditional, honest unknowns',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(si);
 await expect(page.locator('.stage')).toHaveCount(3);
 await expect(page.locator('.stage-arts-summary')).toHaveCount(3);
 await expect(page.locator('.stage-arts-summary').first()).toBeHidden();
 await expect(page.locator('.stage-title').first()).toBeVisible();

 await page.locator('#layout-compact').click();
 await expect(page.locator('.stage-compact-line').first()).toBeVisible();
 await expect(page.locator('.stage-arts-summary')).toHaveCount(3);
 await expect(page.locator('.stage-arts-summary').first()).toBeVisible();
 for(const flow of await page.locator('.stage-arts-summary .arts-checkpoint-flow').all()){
  await expect(flow.locator('[data-relative="before"]')).toHaveCount(1);
  await expect(flow.locator('[data-relative="after"]')).toHaveCount(1);
  await expect(flow).toHaveAttribute('data-kind','transition');
  await expect(flow).toHaveAttribute('aria-label',/До: Cryo Infliction.*После действия.*Corrosion Reaction/);
 }
 const maygiFirst=page.locator('.stage-arts-summary .arts-checkpoint-flow').first();
 await expect(maygiFirst.locator('.arts-infliction .arts-empty-mark')).toHaveText('?');
 await expect(maygiFirst.locator('.arts-infliction img')).toHaveCount(0);
 await expect(maygiFirst.locator('.arts-point-assessment-unknown')).toHaveText('неизв.');
 await expect(maygiFirst.locator('.arts-reaction-level')).toHaveText('?');
 await expect(maygiFirst.locator('.arts-point-assessment-conditional')).toHaveText('если');
 await expect(maygiFirst).toHaveAttribute('title',/точный Status Level неизвестен/);
 await noOverflow(page);
 await page.screenshot({path:testInfo.outputPath('endfield-arts-stage04-maygi-mobile.png'),fullPage:true,animations:'disabled'});

 const prydwenTab=page.locator('#tabs button').filter({has:page.locator('strong',{hasText:'Prydwen'})}).first();
 await prydwenTab.click();
 await expect(page.locator('.stage-arts-summary')).toHaveCount(3);
 const prydwenFirst=page.locator('.stage-arts-summary .arts-checkpoint-flow').first();
 await expect(prydwenFirst.locator('.arts-point-assessment-target')).toHaveText('цель');
 await expect(prydwenFirst.locator('.arts-point-assessment-conditional')).toHaveText('если');
 await expect(prydwenFirst.locator('.arts-infliction')).toHaveAttribute('data-stacks','4');
 await expect(prydwenFirst.locator('.arts-infliction img')).toHaveAttribute('src',/inflictions\/cryo-4\.png$/);
 await expect(prydwenFirst.locator('.arts-reaction img')).toHaveAttribute('src',/reactions\/corrosion\.png$/);
 await expect(prydwenFirst.locator('.arts-reaction-level')).toHaveText('IV');
 await expect(prydwenFirst).toHaveAttribute('aria-label',/цель, не наблюдение/);
 await expect(prydwenFirst).toHaveAttribute('aria-label',/условно, при выполнении требований/);
 await expect(prydwenFirst).toHaveAttribute('title',/поглощены 4 Cryo/);
 const originalRing=prydwenFirst.locator('.arts-infliction img');
 await originalRing.scrollIntoViewIfNeeded();
 await expect.poll(()=>originalRing.evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBe(125);
 await noOverflow(page);
 await page.screenshot({path:testInfo.outputPath('endfield-arts-stage04-prydwen-mobile.png'),fullPage:true,animations:'disabled'});

 await page.setViewportSize({width:320,height:740});
 await expect(prydwenFirst).toBeVisible();
 await noOverflow(page);
 const bounds=await prydwenFirst.boundingBox();
 expect(bounds).not.toBeNull();
 expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(321);
 await page.screenshot({path:testInfo.outputPath('endfield-arts-stage04-320px.png'),fullPage:true,animations:'disabled'});

 // Presentational changes don't affect stage actions or full mode.
 const keycaps=await page.locator('.sequence .keycap').allTextContents();
 await page.locator('#layout-full').click();
 await expect(page.locator('.stage-arts-summary').first()).toBeHidden();
 await expect(page.locator('.stage-title').first()).toBeVisible();
 expect(await page.locator('.sequence .keycap').allTextContents()).toEqual(keycaps);
 await page.locator('#layout-compact').click();
 await page.locator('#loop').click();
 await expect(page.locator('.stage-arts-summary')).toHaveCount(0);
 await expect(page.locator('.stage')).toHaveCount(1);
 await page.locator('#opener').click();
 await expect(page.locator('.stage-arts-summary')).toHaveCount(3);
 expect(errors).toEqual([]);
});

test('Endfield stage checkpoints persist across reload/offline; WuWa still isolated',async({page,context})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(si);
 await page.locator('#layout-compact').click();
 await page.locator('#tabs button').filter({has:page.locator('strong',{hasText:'Prydwen'})}).first().click();
 await expect(page.locator('.stage-arts-summary .arts-infliction img').first()).toBeVisible();
 const img=page.locator('.stage-arts-summary .arts-infliction img').first();
 await img.scrollIntoViewIfNeeded();
 await expect.poll(()=>img.evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBe(125);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready});
 await page.reload();
 await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
 await expect(page.locator('#app')).toHaveClass(/compact-actions/);
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('.stage-arts-summary')).toHaveCount(3);
 const image=page.locator('.stage-arts-summary .arts-infliction img').first();
 await image.scrollIntoViewIfNeeded();
 await expect.poll(()=>image.evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBe(125);
 const reaction=page.locator('.stage-arts-summary .arts-reaction img').first();
 await reaction.scrollIntoViewIfNeeded();
 await expect.poll(()=>reaction.evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBe(72);
 await expect(page.locator('.stage-arts-summary .arts-reaction-level').first()).toHaveText('IV');
 await context.setOffline(false);
 await page.goto('?team=yyxl-suisui-chisa');
 await expect(page.locator('.stage-arts-summary')).toHaveCount(0);
 await expect(page.locator('.progress-wrap')).toBeVisible();
 await expect(page.locator('.stage .complete')).toHaveCount(3);
 expect(errors).toEqual([]);
});
