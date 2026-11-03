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
test('mobile P2: Suoming tap/hold, Hsin optional conditions and honest loop warning',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(hsin);
 const hold=page.locator('.action').filter({hasText:'Engraved Heart'}).first();
 const tap=page.locator('.action').filter({hasText:'Unforsaken Mind'}).first();
 for(const [scheme,normal,held] of [['pc','E','удерж. E'],['ps5','△','удерж. △'],['terms','Skill','Hold Skill']] as const){
  await page.locator('#control-'+scheme).click();
  await expect(tap.locator('.keycap')).toHaveText(normal);
  await expect(hold.locator('.keycap')).toHaveText(held);
  await expect(hold.locator('.action-hint')).toContainText('Отпусти кнопку');
 }
 const conditional=page.locator('.action').filter({hasText:'BA3 → BA4'}).first();
 await expect(conditional.locator('.action-optional')).toHaveText('УСЛОВНО');
 await expect(conditional.locator('.action-condition')).toContainText('Forte < 100');
 await expect(page.locator('.loop-warning')).toBeHidden();
 await page.locator('#loop').click();
 await expect(page.locator('.loop-warning')).toContainText('Steady-loop Shorekeeper');
 await page.locator('#tabs button').filter({has:page.locator('strong',{hasText:'Prydwen + Swap Cancel'})}).first().click();
 await expect(page.locator('.loop-warning')).toContainText('Swap Cancel');
 await expect(page.locator('.action').filter({hasText:'Illumining (Swap Cancel!)'}).first().locator('.action-optional')).toHaveText('УСЛОВНО');
 await page.locator('#opener').click();
 await expect(page.locator('.loop-warning')).toBeHidden();
 await page.screenshot({path:testInfo.outputPath('hsin-p2-mobile.png'),fullPage:true,animations:'disabled'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
 expect(errors).toEqual([]);
});

test('Endfield gallery: 34 genuine icons, names, gender variants and offline PWA',async({page,context},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('?portraits=arknights-endfield');
 await expect(page.locator('h1')).toContainText('Arknights: Endfield');
 await expect(page.locator('.portrait-card')).toHaveCount(34);
 await expect(page.locator('.portrait-counter')).toContainText('34 / 34');
 const arcane=page.locator('.portrait-card').filter({has:page.locator('.portrait-id',{hasText:'arcane'})});
 await expect(arcane.locator('.portrait-name')).toHaveText('Arcane');
 await arcane.locator('img').scrollIntoViewIfNeeded();
 await expect.poll(()=>arcane.locator('img').evaluate(img=>(img as HTMLImageElement).naturalWidth)).toBe(150);
 await expect(arcane.locator('img')).toHaveAttribute('src',/\/portraits\/arknights-endfield\/arcane\.png$/);
 await expect(arcane.locator('.portrait-source')).toHaveAttribute('href','https://endfieldtools.dev/characters/arcane/');
 const si=page.locator('.portrait-card').filter({has:page.locator('.portrait-id',{hasText:/^si$/})});
 await si.locator('img').scrollIntoViewIfNeeded();
 await expect.poll(()=>si.locator('img').evaluate(img=>(img as HTMLImageElement).naturalWidth)).toBe(150);
 await page.locator('.portrait-search').fill('endministrator');
 await expect(page.locator('.portrait-card')).toHaveCount(2);
 await expect(page.locator('.portrait-id')).toHaveText(['endministrator-f','endministrator-m']);
 await page.locator('.portrait-search').fill('');
 await expect(page.locator('.portrait-card')).toHaveCount(34);
 const urls=await page.locator('.portrait-card img').evaluateAll(imgs=>imgs.map(x=>(x as HTMLImageElement).src));
 await page.screenshot({path:testInfo.outputPath('endfield-34-mobile.png'),fullPage:true,animations:'disabled'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready});
 await page.reload();
 await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('.portrait-card')).toHaveCount(34);
 const result=await page.evaluate(async(images)=>{
  const checks=await Promise.all(images.map(async url=>{
   try{const r=await fetch(url);return r.ok&&r.headers.get('content-type')?.includes('image/png')&&(await r.arrayBuffer()).byteLength>300}
   catch{return false}
  }));
  return {checked:checks.length,failed:checks.filter(ok=>!ok).length};
 },urls);
 expect(result).toEqual({checked:34,failed:0});
 expect(errors).toEqual([]);
});

test('WuWa portrait gallery remains unchanged after adding Endfield',async({page})=>{
 await page.goto('?portraits=wuthering-waves');
 await expect(page.locator('h1')).toContainText('Wuthering Waves');
 await expect(page.locator('.portrait-card')).toHaveCount(61);
 await page.locator('.portrait-search').fill('yangyang');
 await expect(page.locator('.portrait-card')).toHaveCount(2);
 await expect(page.locator('.portrait-id')).toHaveText(['yangyang','yangyang-xuanling']);
});

test('mobile Endfield Si: two authored variants, actor-owned input chips and resource-only loop',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('?team=si-tangtang-arcane-xaihi');
 await expect(page.locator('#opener')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.stage')).toHaveCount(3);
 await expect(page.locator('.action-label').filter({hasText:'Arcane (WILL) · Скопировать Cryo'})).toHaveCount(1);
 const xaihiFs=page.locator('.action').filter({hasText:'×2 · открыть Xaihi Combo'}).first();
 await expect(xaihiFs.locator('.keycap')).toHaveText('FS');
 const fillerBa=page.locator('.action').filter({hasText:'До готовности Combo Arcane'}).first();
 await expect(fillerBa.locator('.keycap')).toContainText('BA');
 await expect(page.locator('.action').filter({hasText:'×2 · Xaihi Combo и SP'}).first().locator('.keycap')).toHaveText('FS');
 await page.locator('#control-pc').click();
 await expect(page.locator('.action').filter({hasText:'Открыть Artful Intent'}).first().locator('.keycap')).toHaveText('4');
 await expect(page.locator('.action').filter({hasText:'Скопировать Cryo'}).first().locator('.keycap')).toHaveText('E');
 await page.locator('#tabs button').filter({has:page.locator('strong',{hasText:'Prydwen'})}).first().click();
 await expect(page.locator('.stage')).toHaveCount(3);
 await expect(page.locator('.action').filter({hasText:'Tangtang · Под Crystal'}).first().locator('.keycap')).toHaveText('ЛКМ → FS');
 const tangtangUlt=page.locator('.action-label').filter({hasText:'Ultimate Tangtang · OLDEN STARE'});
 await expect(tangtangUlt).toHaveCount(1);
 const tangtangDive=page.locator('.action-label').filter({hasText:'Dive Attack · завершение OLDEN STARE'});
 await expect(tangtangDive).toHaveCount(1);
 const actions=await page.locator('.action-label').allTextContents();
 const ultimateIdx=actions.indexOf('Tangtang · Ultimate Tangtang · OLDEN STARE');
 expect(actions[ultimateIdx+1]).toBe('Tangtang · Dive Attack · завершение OLDEN STARE');
 await page.locator('#loop').click();
 await expect(page.locator('.stage-title').first()).toHaveText('Повтор не верифицирован');
 await expect(page.locator('.loop-warning')).toContainText('не является универсальным');
 await page.locator('#opener').click();
 await expect(page.locator('.stage img')).toHaveCount(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
 await page.screenshot({path:testInfo.outputPath('endfield-si-mobile.png'),fullPage:true,animations:'disabled'});
 expect(errors).toEqual([]);
});
