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
 await expect(page.locator('.stage-head .portrait img')).toHaveCount(3);
 await expect(page.locator('.action.endfield-action .action-portrait')).toHaveCount(await page.locator('.action').count());
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
 await page.screenshot({path:testInfo.outputPath('endfield-si-mobile.png'),fullPage:true,animations:'disabled'});
 expect(errors).toEqual([]);
});


test('Endfield semantic colors remain distinct in both Si variants and never leak to WuWa',async({page})=>{
 await page.goto('?team=si-tangtang-arcane-xaihi');
 const kinds=['skill','combo','final-strike','ultimate','finisher','dive','basic','dodge'];
 const swatches=await page.evaluate(kinds=>kinds.map(kind=>{
  const chip=document.querySelector<HTMLElement>('.action.endfield-action.kind-'+kind);
  if(!chip)throw new Error('Missing kind '+kind);
  const cap=chip.querySelector<HTMLElement>('.keycap');
  if(!cap)throw new Error('Missing keycap '+kind);
  return {kind,color:getComputedStyle(cap).color,border:getComputedStyle(chip).borderLeftColor,background:getComputedStyle(chip).backgroundColor};
 }),kinds);
 expect(new Set(swatches.map(x=>x.color)).size).toBe(kinds.length);
 expect(new Set(swatches.map(x=>x.border)).size).toBe(kinds.length);
 expect(new Set(swatches.map(x=>x.background)).size).toBe(kinds.length);
 for(const s of swatches)expect(s.color).toBe(s.border);
 // Same narrative tone=key no longer makes Skill and Combo share a color.
 const skill=swatches.find(x=>x.kind==='skill')!;
 const combo=swatches.find(x=>x.kind==='combo')!;
 expect(skill.color).not.toBe(combo.color);
 await page.locator('#control-pc').click();
 expect(await page.locator('.action.endfield-action.kind-skill .keycap').first().evaluate(el=>getComputedStyle(el).color)).toBe(skill.color);
 await page.locator('#tabs button').filter({has:page.locator('strong',{hasText:'Prydwen'})}).first().click();
 for(const kind of ['skill','combo','final-strike','ultimate','finisher','dive']){
  const chip=page.locator('.action.endfield-action.kind-'+kind).first();
  await expect(chip).toBeVisible();
  expect(await chip.locator('.keycap').evaluate(el=>getComputedStyle(el).color)).toBe(swatches.find(x=>x.kind===kind)!.color);
 }
 await page.goto('?team=yyxl-suisui-chisa');
 await expect(page.locator('.action.endfield-action')).toHaveCount(0);
 await expect(page.locator('.action.key')).not.toHaveCount(0);
});

test('Endfield action mini portraits: original 48px sprites at 24 CSS px, actor ownership and offline PWA',async({page,context},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('?team=si-tangtang-arcane-xaihi');
 await expect(page.locator('.stage')).toHaveCount(3);
 const counts=await page.evaluate(()=>({
  actions:document.querySelectorAll('.action').length,
  minis:document.querySelectorAll('.action.endfield-action img.action-portrait').length
 }));
 expect(counts.actions).toBeGreaterThan(25);
 expect(counts.minis).toBe(counts.actions);
 const samples=[
  ['Открыть Artful Intent','si'],
  ['Скопировать Cryo через WILL Combo','arcane'],
  ['Создать Whirlpool','tangtang'],
  ['Auxiliary Crystal','xaihi']
 ] as const;
 for(const [label,id] of samples){
  const chip=page.locator('.action').filter({hasText:label}).first();
  const img=chip.locator('.action-portrait');
  await expect(img).toHaveAttribute('src',new RegExp('arknights-endfield-mini/'+id+'\\.png$'));
  await img.scrollIntoViewIfNeeded();
  await expect.poll(()=>img.evaluate(node=>(node as HTMLImageElement).naturalWidth)).toBe(48);
  expect(await img.evaluate(node=>getComputedStyle(node).width)).toBe('24px');
  expect(await img.evaluate(node=>getComputedStyle(node).height)).toBe('24px');
 }
 await page.screenshot({path:testInfo.outputPath('endfield-si-minis-full-mobile.png'),fullPage:true,animations:'disabled'});
 await page.locator('#tabs button').filter({has:page.locator('strong',{hasText:'Prydwen'})}).first().click();
 await expect(page.locator('.action-portrait')).toHaveCount(await page.locator('.action').count());
 const arcaneCombo=page.locator('.action').filter({hasText:'WILL Combo Arcane'}).first();
 await expect(arcaneCombo.locator('.action-portrait')).toHaveAttribute('src',/arknights-endfield-mini\/arcane\.png$/);
 await page.screenshot({path:testInfo.outputPath('endfield-si-minis-prydwen-mobile.png'),fullPage:true,animations:'disabled'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
 // The service worker precaches new PNG assets; the same card must load offline.
 await page.evaluate(async()=>{await navigator.serviceWorker.ready});
 await page.reload();
 await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded'});
 const offline=page.locator('.action').filter({hasText:'WILL Combo Arcane'}).first().locator('.action-portrait');
 await offline.scrollIntoViewIfNeeded();
 await expect.poll(()=>offline.evaluate(node=>(node as HTMLImageElement).naturalWidth)).toBe(48);
 await context.setOffline(false);
 await page.goto('?team=yyxl-suisui-chisa');
 await expect(page.locator('.action-portrait')).toHaveCount(0);
 expect(errors).toEqual([]);
});


test('Endfield compact mode: smaller mobile chips, preserved FS ×2 / Hold / Stagger and persisted selection',async({page,context},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('?team=si-tangtang-arcane-xaihi');
 await expect(page.locator('#layout-full')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#layout-compact')).toHaveAttribute('aria-pressed','false');
 const fs=page.locator('.action').filter({hasText:'×2 · открыть Xaihi Combo'}).first();
 const fullHeight=await fs.evaluate(el=>el.getBoundingClientRect().height);
 await expect(fs.locator('.action-label')).toBeVisible();
 await page.locator('#layout-compact').click();
 await expect(page.locator('#app')).toHaveClass(/compact-actions/);
 await expect(page.locator('#layout-compact')).toHaveAttribute('aria-pressed','true');
 await expect(fs.locator('.action-label')).toBeHidden();
 await expect(fs.locator('.action-compact-modifier')).toBeVisible();
 await expect(fs.locator('.action-compact-modifier')).toHaveText('×2');
 await expect(fs.locator('.keycap')).toHaveText('FS');
 await expect(fs.locator('.action-portrait')).toBeVisible();
 const compactHeight=await fs.evaluate(el=>el.getBoundingClientRect().height);
 expect(compactHeight).toBeLessThan(fullHeight-8);
 // Stage notes are only for full mode; compact view is the action-only cheat sheet.
 await expect(page.locator('.checks').first()).toBeHidden();
 await expect(page.locator('.extras').first()).toBeHidden();
 await expect(page.locator('.stage-compact-line').first()).toBeVisible();
 await expect(page.locator('.stage-title').first()).toBeHidden();
 await expect(page.locator('.stage-head .portrait').first()).toBeHidden();
 await expect(page.locator('.stage .complete')).toHaveCount(0);
 await expect(page.locator('.progress-wrap')).toHaveCount(0);
 await expect(page.locator('#reset')).toHaveCount(0);
 await page.screenshot({path:testInfo.outputPath('endfield-si-compact-maygi-mobile.png'),fullPage:true,animations:'disabled'});
 await page.locator('#control-pc').click();
 await expect(fs.locator('.keycap')).toHaveText('ЛКМ → FS');
 await expect(fs.locator('.action-compact-modifier')).toHaveText('×2');
 await page.locator('#tabs button').filter({has:page.locator('strong',{hasText:'Prydwen'})}).first().click();
 const conditional=page.locator('.action').filter({hasText:'Finisher Tangtang'}).first();
 await expect(conditional.locator('.action-compact-condition')).toHaveText('Stagger');
 await expect(conditional.locator('.action-optional')).toBeHidden();
 await expect(conditional.locator('.action-condition')).toBeHidden();
 await expect(conditional).toHaveAttribute('title',/Stagger/);
 const held=page.locator('.action').filter({hasText:'Ultimate Si →'}).first();
 await expect(held.locator('.keycap')).toHaveText('удерж. 4');
 await expect(page.locator('.stage')).toHaveCount(3);
 await expect(page.locator('.checks')).toHaveCount(3);
 await expect(page.locator('.checks').first()).toBeHidden();
 await expect(page.locator('.extras').first()).toBeHidden();
 await expect(page.locator('.action.endfield-action .action-portrait')).toHaveCount(await page.locator('.action').count());
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
 await page.screenshot({path:testInfo.outputPath('endfield-si-compact-prydwen-mobile.png'),fullPage:true,animations:'disabled'});
 await page.reload();
 await expect(page.locator('#layout-compact')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#app')).toHaveClass(/compact-actions/);
 await expect(page.locator('#control-pc')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.action-compact-condition')).toHaveCount(1);
 await page.locator('#loop').click();
 await expect(page.locator('.loop-warning')).toBeVisible();
 await expect(page.locator('#app')).toHaveClass(/compact-actions/);
 await page.locator('#opener').click();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready});
 await page.reload();
 await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('#layout-compact')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.action-portrait').first()).toBeVisible();
 await context.setOffline(false);
 await page.locator('#layout-full').click();
 await expect(page.locator('#app')).not.toHaveClass(/compact-actions/);
 await expect(page.locator('.action-label').first()).toBeVisible();
 await expect(page.locator('.stage-title').first()).toBeVisible();
 await expect(page.locator('.stage-head .portrait').first()).toBeVisible();
 await expect(page.locator('.stage-compact-line').first()).toBeHidden();
 await expect(page.locator('.checks').first()).toBeVisible();
 await expect(page.locator('.extras').first()).toBeVisible();
 await page.reload();
 await expect(page.locator('#layout-full')).toHaveAttribute('aria-pressed','true');
 await page.goto('?team=yyxl-suisui-chisa');
 await expect(page.locator('#layout-compact')).toHaveCount(0);
 await expect(page.locator('#app')).not.toHaveClass(/compact-actions/);
 expect(errors).toEqual([]);
});


test('Endfield: compact numbered one-line headings, no progress UI; WuWa retains checklist',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('?team=si-tangtang-arcane-xaihi');
 await expect(page.locator('.stage')).toHaveCount(3);
 await expect(page.locator('.stage .complete')).toHaveCount(0);
 await expect(page.locator('.progress-wrap')).toHaveCount(0);
 await expect(page.locator('#reset')).toHaveCount(0);
 await expect(page.locator('.stage-title').nth(1)).toHaveText('Maygi · 2. Второй пакет');
 const fullHeight=await page.locator('.stage').nth(1).evaluate(e=>e.getBoundingClientRect().height);
 await page.locator('#layout-compact').click();
 await expect(page.locator('.stage-compact-line').nth(1)).toHaveText('02 / 03  ·  Второй пакет');
 await expect(page.locator('.stage-compact-line').nth(1)).toBeVisible();
 await expect(page.locator('.stage-head .portrait').nth(1)).toBeHidden();
 await expect(page.locator('.stage-title').nth(1)).toBeHidden();
 await expect(page.locator('.stage-sub').nth(1)).toBeHidden();
 await expect(page.locator('.stage-compact-line').nth(1)).toHaveCSS('white-space','nowrap');
 const compactHeight=await page.locator('.stage').nth(1).evaluate(e=>e.getBoundingClientRect().height);
 expect(compactHeight).toBeLessThan(fullHeight-80);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
 await page.screenshot({path:testInfo.outputPath('endfield-lean-maygi-mobile.png'),fullPage:true,animations:'disabled'});
 await page.locator('#tabs button').filter({has:page.locator('strong',{hasText:'Prydwen'})}).first().click();
 await expect(page.locator('.stage-compact-line').first()).toHaveText('01 / 03  ·  Первый Corrosion');
 await expect(page.locator('.stage-compact-line').nth(2)).toHaveText('03 / 03  ·  Stagger burst');
 await page.screenshot({path:testInfo.outputPath('endfield-lean-prydwen-mobile.png'),fullPage:true,animations:'disabled'});
 await page.locator('#layout-full').click();
 await expect(page.locator('.stage-title').first()).toBeVisible();
 await expect(page.locator('.stage-head .portrait').first()).toBeVisible();
 await expect(page.locator('.stage-compact-line').first()).toBeHidden();
 // Step-by-step navigation remains available, without setting completion.
 await page.locator('#view').click();
 await expect(page.locator('.stage')).toHaveCount(1);
 await page.locator('#next').click();
 await expect(page.locator('.stage-title').first()).toContainText('2. Второй Corrosion');
 await expect(page.locator('.stage.completed')).toHaveCount(0);
 expect(await page.evaluate(()=>localStorage.getItem('game-rotations:v2:si-tangtang-arcane-xaihi:done:prydwen-opener'))).toBeNull();
 await page.goto('?team=yyxl-suisui-chisa');
 await expect(page.locator('.stage .complete')).toHaveCount(3);
 await expect(page.locator('.progress-wrap')).toBeVisible();
 await expect(page.locator('#reset')).toBeVisible();
 expect(errors).toEqual([]);
});
