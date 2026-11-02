import {test,expect} from '@playwright/test';

const hsin='?team=hsin-suoming-shorekeeper';
const yyxl='?team=yyxl-suisui-chisa';
const labels=async(page:import('@playwright/test').Page)=>page.locator('.action-label').allTextContents();

test('mobile Hsin: fresh opener, real labels, all input schemes and named Intro',async({page},testInfo)=>{
 const errors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(hsin);
 await expect(page.locator('#opener')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.stage-title').first()).toHaveText('Shorekeeper · первый заход');
 await expect(page.locator('.stage')).toHaveCount(5);
 await expect(page.locator('.action-label').filter({hasText:'BA ×4'})).toHaveCount(2);
 for(const control of ['pc','ps5','terms']){
  await page.locator('#control-'+control).click();
  expect(await labels(page)).toContain('BA · до 800 Delusion');
  expect(await labels(page)).toContain('Pillars BA · до 0 Heart');
  expect(await labels(page)).toContain('Intro · Whirling Thunder (Unison)');
  expect(await labels(page)).not.toContain('Death Snip FULL · добить удары');
 }
 await page.locator('#loop').click();
 await expect(page.locator('.stage-title').first()).toHaveText('Shorekeeper · повторный цикл');
 expect(await labels(page)).toContain('Intro · Discernment');
 await page.locator('#control-pc').click();
 await expect(page.locator('#control-pc')).toHaveAttribute('aria-pressed','true');
 const firstIntro=page.locator('.action').filter({hasText:'Intro · Discernment'}).first();
 await expect(firstIntro.locator('.keycap')).toHaveText('3');
 await page.locator('#control-ps5').click();
 await expect(page.locator('.action').filter({hasText:'Intro · Discernment'}).first().locator('.keycap')).toHaveText('D-Pad ↓');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 expect(overflow).toBeLessThanOrEqual(1);
 await page.screenshot({path:testInfo.outputPath('hsin-mobile.png'),fullPage:true,animations:'disabled'});
 expect(errors).toEqual([]);
});

test('mobile YYXL: all three variants and original action meanings remain visible',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(yyxl);
 await expect(page.locator('#opener')).toHaveAttribute('aria-pressed','true');
 for(const [variant,count] of [['1F1A',3],['2F',3],['2F QS',7]] as const){
  await page.locator('#tabs button').filter({has:page.locator('strong',{hasText:variant})}).first().click();
  await expect(page.locator('.stage')).toHaveCount(count);
  await page.locator('#loop').click();
  await expect(page.locator('.stage')).toHaveCount(count);
  await page.locator('#opener').click();
 }
 await page.locator('#tabs button').filter({has:page.locator('strong',{hasText:'1F1A'})}).first().click();
 expect(await labels(page)).toContain('Death Snip · FULL');
 expect(await labels(page)).toContain('Feather Fall');
 expect(await labels(page)).toContain('Bloom 1–3');
 await page.screenshot({path:testInfo.outputPath('yyxl-mobile.png'),fullPage:true,animations:'disabled'});
 expect(errors).toEqual([]);
});

test('PWA offline reload preserves team, portraits and saved repeat selection',async({page,context})=>{
 await page.goto(hsin);
 await expect(page.locator('.stage')).toHaveCount(5);
 await page.locator('#loop').click();
 await expect(page.locator('#loop')).toHaveAttribute('aria-pressed','true');
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 await page.reload();
 await expect(page.locator('.stage')).toHaveCount(5);
 await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('#loop')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.action-label').filter({hasText:'Intro · Discernment'})).toHaveCount(1);
 const broken=await page.locator('.stage img').evaluateAll(images=>images.filter(i=>(i as HTMLImageElement).complete&&!(i as HTMLImageElement).naturalWidth).length);
 expect(broken).toBe(0);
});