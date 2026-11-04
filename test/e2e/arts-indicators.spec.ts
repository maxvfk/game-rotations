import {test,expect} from '@playwright/test';

const gallery='?arts=arknights-endfield';

test('Endfield Arts preview: original stack ring sprites, mobile sizes, unknowns and reaction levels',async({page},testInfo)=>{
 const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(gallery);
 await expect(page.locator('h1')).toHaveText('Arts-индикаторы · Endfield');
 await expect(page.locator('.arts-stack-matrix .arts-infliction')).toHaveCount(16);
 await expect(page.locator('.arts-reaction-matrix .arts-reaction')).toHaveCount(16);
 await expect(page.locator('.arts-notice')).toContainText('не означают проверенное состояние');
 const selected=page.locator('.arts-selected');
 await expect(selected.locator('.arts-infliction')).toHaveAttribute('aria-label',/Cryo Infliction: 4\/4/);
 const png=selected.locator('.arts-infliction img');
 await expect(png).toHaveAttribute('src',/arts\/arknights-endfield\/inflictions\/cryo-4\.png$/);
 await expect.poll(()=>png.evaluate(i=>(i as HTMLImageElement).naturalWidth)).toBe(125);
 for(const size of [24,28,32]){
  const button=page.locator('[data-size="'+size+'"]');
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed','true');
  const image=selected.locator('.arts-infliction img');
  await expect(image).toHaveCSS('width',size+'px');
  await expect(image).toHaveCSS('height',size+'px');
 }
 await page.locator('#arts-element').selectOption('electric');
 await page.locator('#arts-stacks').selectOption('2');
 await page.locator('#arts-reaction').selectOption('electrification');
 await page.locator('#arts-level').selectOption('3');
 await expect(selected.locator('.arts-infliction img')).toHaveAttribute('src',/electric-2\.png$/);
 await expect(selected.locator('.arts-reaction img')).toHaveAttribute('src',/electrification\.png$/);
 await expect(selected.locator('.arts-reaction-level')).toHaveText('III');
 const rx=selected.locator('.arts-reaction img');
 await expect.poll(()=>rx.evaluate(i=>(i as HTMLImageElement).naturalWidth)).toBe(73);
 await expect.poll(()=>rx.evaluate(i=>(i as HTMLImageElement).naturalHeight)).toBe(72);
 await page.screenshot({path:testInfo.outputPath('endfield-arts-preview-32-mobile.png'),fullPage:true,animations:'disabled'});
 // All four original PNGs use one in-icon layout with their own sampled
 // original sprite color; save distinct 390px screenshots for visual QA.
 const colors:Record<string,string>={
  combustion:'rgb(255, 98, 61)',electrification:'rgb(253, 207, 29)',
  solidification:'rgb(33, 198, 208)',corrosion:'rgb(195, 227, 84)',
 };
 const reaction=selected.locator('.arts-reaction');
 for(const [name,color] of Object.entries(colors)){
  await page.locator('#arts-reaction').selectOption(name);
  await page.locator('#arts-level').selectOption('2');
  await expect(reaction).toHaveClass(/arts-reaction-level-overlay/);
  const levelBadge=reaction.locator('.arts-reaction-level');
  await expect(levelBadge).toHaveText('II');
  await expect(levelBadge).toHaveCSS('position','absolute');
  await expect(levelBadge).toHaveCSS('color',color);
  await expect(levelBadge).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await expect(levelBadge).toHaveCSS('border-top-width','0px');
  const iconRect=await reaction.locator('img').boundingBox();
  const levelRect=await levelBadge.boundingBox();
  expect(iconRect).not.toBeNull();expect(levelRect).not.toBeNull();
  expect(levelRect!.x).toBeGreaterThan(iconRect!.x+iconRect!.width*.25);
  expect(levelRect!.y).toBeGreaterThan(iconRect!.y+iconRect!.height*.35);
  await page.screenshot({path:testInfo.outputPath('endfield-'+name+'-level-overlay-390px.png'),fullPage:true,animations:'disabled'});
 }
 await page.setViewportSize({width:320,height:730});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
 await expect(reaction.locator('.arts-reaction-level')).toBeVisible();
 await page.screenshot({path:testInfo.outputPath('endfield-arts-preview-320px.png'),fullPage:true,animations:'disabled'});
 await page.locator('#arts-stacks').selectOption('unknown');
 await page.locator('#arts-level').selectOption('unknown');
 await expect(reaction).not.toHaveClass(/arts-reaction-level-overlay/);
 await expect(selected.locator('.arts-infliction img')).toHaveCount(0);
 await expect(selected.locator('.arts-infliction .arts-empty-mark')).toHaveText('?');
 await expect(selected.locator('.arts-reaction-level')).toHaveText('?');
 await page.locator('#arts-stacks').selectOption('0');
 await expect(selected.locator('.arts-infliction img')).toHaveCount(0);
 await expect(selected.locator('.arts-infliction .arts-empty-mark')).toHaveText('—');
 expect(errors).toEqual([]);
});

test('Endfield Arts gallery works offline via PWA; all 20 sprites cached, other routes unchanged',async({page,context})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('');
 await expect(page.locator('a[href*="?arts=arknights-endfield"]')).toBeVisible();
 await page.locator('a[href*="?arts=arknights-endfield"]').click();
 await expect(page.locator('.arts-stack-matrix .arts-infliction')).toHaveCount(16);
 const original=page.locator('.arts-stack-matrix img').first();
 await original.scrollIntoViewIfNeeded();
 await expect.poll(()=>original.evaluate(i=>(i as HTMLImageElement).naturalWidth)).toBe(125);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready});
 await page.reload();
 await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('.arts-stack-matrix .arts-infliction')).toHaveCount(16);
 await expect(page.locator('.arts-reaction-matrix .arts-reaction')).toHaveCount(16);
 const offlineInfliction=page.locator('.arts-stack-matrix img').first();
 await offlineInfliction.scrollIntoViewIfNeeded();
 await expect.poll(()=>offlineInfliction.evaluate(i=>(i as HTMLImageElement).naturalWidth)).toBe(125);
 const offlineReaction=page.locator('.arts-reaction-matrix img').first();
 await offlineReaction.scrollIntoViewIfNeeded();
 await expect.poll(()=>offlineReaction.evaluate(i=>(i as HTMLImageElement).naturalWidth)).toBe(72);
 await context.setOffline(false);
 await page.goto('?team=si-tangtang-arcane-xaihi');
 await expect(page.locator('.stage')).toHaveCount(3);
 await expect(page.locator('.arts-preview-root')).toHaveCount(0);
 await page.goto('?portraits=arknights-endfield');
 await expect(page.locator('.portrait-card')).toHaveCount(34);
 expect(errors).toEqual([]);
});
