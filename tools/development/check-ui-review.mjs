import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const root = fileURLToPath(new URL('../../', import.meta.url));
const html = await readFile(path.join(root, 'docs/review/ui-20261007/index.html'), 'utf8');
const model = JSON.parse(await readFile(path.join(root, 'docs/design/ui-screens-20261007.json'), 'utf8'));
const tokens = JSON.parse(await readFile(path.join(root, 'docs/design/ui-system.json'), 'utf8'));
const embedded = JSON.parse(html.match(/<script id="screen-model" type="application\/json">([\s\S]*?)<\/script>/)[1]);
assert.deepEqual(embedded, model);
assert.equal(model.sample.interest.expectedYen, model.sample.interest.targetYen * model.sample.interest.percent / 100);
assert(model.sample.original.includes(model.sample.excerpt));
assert.equal(model.screens.length, 12);
const output = path.join(root, 'tools/development/ui-review-evidence');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const checks = [];
try {
 const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
 const page = await context.newPage();
 const pageErrors = [];
 page.on('pageerror', error => pageErrors.push(String(error)));
 const requests = [];
 await page.route('**/*', route => {
  requests.push(route.request().url());
  if (route.request().url() === 'http://ui-review.invalid/') return route.fulfill({contentType:'text/html; charset=utf-8', body:html});
  return route.abort();
 });
 const product = page.locator('#product');
 async function reload() { await page.goto('http://ui-review.invalid/'); }
 async function view(role, id, scenario='normal') {
  await page.getByLabel('役割', { exact:true }).selectOption(role);
  await page.getByLabel('見る画面', { exact:true }).selectOption(id);
  await page.getByLabel('状態', { exact:true }).selectOption(scenario);
 }
 await reload();
 // A new choice must not create a fabricated first-person reason.
 await product.getByRole('button', {name:'この条件で始める',exact:true}).click();
 await product.getByLabel('来週にする', {exact:true}).check();
 await product.getByRole('button', {name:'選んだことを残す',exact:true}).click();
 await expect(product.getByLabel('話したこと・直して残せます')).toHaveValue('');
 checks.push('new_choice_has_no_invented_record');
 // A private save ends the activity and does not create a public article.
 await reload(); await view('child', 'UI03');
 await expect(product.getByLabel('家族にも見せたい',{exact:true})).not.toBeChecked();
 await product.getByRole('button',{name:'この内容で残す',exact:true}).click();
 await expect(product.getByText('記録：保存済み',{exact:true})).toBeVisible();
 await expect(product.getByText('共有：共有なし',{exact:true})).toBeVisible();
 await view('grandparent','UI08');
 await expect(product.getByText('今日は新しい記事がありません',{exact:true})).toBeVisible();
 assert.equal(await product.locator('blockquote').count(),0);
 checks.push('private_save_no_publication');
 // Failed saves retain the original, and an explicit retry can request review.
 await reload(); await view('child','UI03','save_fail');
 const note='来週にする。今日は買わなかった。';
 await product.getByLabel('話したこと・直して残せます').fill(note);
 await product.getByLabel('家族にも見せたい',{exact:true}).check();
 await product.getByRole('button',{name:'保存して親に確認を頼む',exact:true}).click();
 await expect(product.getByText('記録：未保存',{exact:true})).toBeVisible();
 await expect(product.getByLabel('話したこと・直して残せます')).toHaveValue(note);
 await page.getByLabel('状態',{exact:true}).selectOption('normal');
 await product.getByRole('button',{name:'もう一度保存する',exact:true}).click();
 await expect(product.getByText('共有：親の確認待ち',{exact:true})).toBeVisible();
 await view('grandparent','UI08');
 assert.equal(await product.locator('blockquote').count(),0);
 await view('parent','UI06');
 await expect(product.locator('blockquote').first()).toHaveText(note);
 await product.getByRole('button',{name:'この内容を送る',exact:true}).click();
 await expect(product.getByText('共有：共有済み',{exact:true})).toBeVisible();
 await view('grandparent','UI08');
 await expect(product.locator('blockquote')).toHaveText(note);
 checks.push('save_failure_retry_pending_parent_publish_same_words');
 // Only the selected source range moves to the newspaper.
 await reload(); await view('child','UI03');
 await product.getByLabel('家族にも見せたい',{exact:true}).check();
 await expect(product.locator('blockquote')).toHaveText(model.sample.excerpt);
 await product.getByRole('button',{name:'保存して親に確認を頼む',exact:true}).click();
 await expect(product.getByText('共有：親の確認待ち',{exact:true})).toBeVisible();
 await view('parent','UI06');
 await expect(product.locator('blockquote').first()).toHaveText(model.sample.excerpt);
 await product.getByRole('button',{name:'この内容を送る',exact:true}).click();
 await expect(product.getByText('共有：共有済み',{exact:true})).toBeVisible();
 await view('grandparent','UI08');
 await expect(product.locator('blockquote')).toHaveText(model.sample.excerpt);
 assert(!((await product.innerText()).includes('860円')));
 assert(!((await product.innerText()).includes('1,000円')));
 checks.push('approved_excerpt_not_private_budget');
 // Changing content/audience prevents use of the old approval.
 await reload(); await view('parent','UI06');
 await product.getByRole('button',{name:'内容や相手を変える',exact:true}).click();
 assert.equal(await product.getByRole('button',{name:'この内容を送る',exact:true}).count(),0);
 await product.getByRole('button',{name:'子どもに選び直してもらう',exact:true}).click();
 await expect(product.getByLabel('家族にも見せたい',{exact:true})).not.toBeChecked();
 checks.push('changed_review_requires_new_child_selection');
 // Adult posting requires no parent review, and failure retains manual values.
 await reload(); await view('grandparent','UI10','send_fail');
 await product.getByLabel('今日の一言',{exact:true}).fill('今日は家で本を読んだ。');
 await product.getByLabel('今日の歩数（手入力）',{exact:true}).fill('1800');
 await product.getByRole('button',{name:'この内容を送る',exact:true}).click();
 await expect(product.getByText('共有：未送信',{exact:true})).toBeVisible();
 await expect(product.getByLabel('今日の一言',{exact:true})).toHaveValue('今日は家で本を読んだ。');
 await expect(product.getByLabel('今日の歩数（手入力）',{exact:true})).toHaveValue('1800');
 await page.getByLabel('状態',{exact:true}).selectOption('normal');
 await product.getByRole('button',{name:'この内容を送る',exact:true}).click();
 await expect(product.getByText('共有：共有済み',{exact:true})).toBeVisible();
 assert(!((await product.innerText()).includes('親の確認待ち')));
 checks.push('adult_post_no_parent_gate_failed_input_retained');
 // Points are reserved for a request; yen remains unchanged.
 await reload(); await view('child','UI05');
 await product.getByRole('button',{name:'このごほうびをお願いする',exact:true}).click();
 await expect(product.getByText('申請中',{exact:true})).toBeVisible();
 await expect(product.getByText('使えるポイント：20 P',{exact:true})).toBeVisible();
 assert.equal(await product.getByRole('button',{name:'このごほうびをお願いする',exact:true}).count(),0);
 await product.getByRole('button',{name:'お金とごほうびに戻る',exact:true}).click();
 assert((await product.innerText()).includes('500 円'));
 checks.push('reward_requested_not_received_yen_unchanged');
 // Every represented screen has labels, role font/target sizes and no more
 // than one primary action; audit the inspectable review, not product code.
 for(const screen of model.screens){
  await reload(); await view(screen.role,screen.id);
  assert.equal(await product.getByRole('heading',{level:2,name:screen.title,exact:true}).count(),1);
  assert((await product.locator('.primary').count())<=1);
  const measures=await product.evaluate(node=>({font:parseFloat(getComputedStyle(node).fontSize),buttons:[...node.querySelectorAll('button')].map(button=>({height:button.getBoundingClientRect().height,primary:button.classList.contains('primary')}))}));
  assert(measures.font>=tokens.roles[screen.role].bodyMinPx,JSON.stringify(measures));
  for(const button of measures.buttons)assert(button.height>=(button.primary?tokens.roles[screen.role].primaryTouchMinPx:tokens.roles[screen.role].touchMinPx));
  const result=await new AxeBuilder({page}).analyze();
  assert.equal(result.violations.length,0,JSON.stringify({screen:screen.id,violations:result.violations}));
  await page.keyboard.press('Tab');
  assert(await page.evaluate(()=>document.activeElement?.tagName!=='BODY'));
 }
 checks.push('12_screens_roles_targets_one_primary_keyboard_axe');
 let layouts=0;
 for(const width of [320,360,390,768]){
  await page.setViewportSize({width,height:1000});
  for(const scale of ['1','2']){
   for(const screen of model.screens){
    await reload(); await view(screen.role,screen.id);
    await page.getByLabel('文字',{exact:true}).selectOption(scale);
    const reflow=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,product:document.getElementById('product').scrollWidth,client:document.getElementById('product').clientWidth}));
    assert(reflow.document<=reflow.viewport+1,JSON.stringify({screen:screen.id,width,scale,reflow}));
    assert(reflow.product<=reflow.client+1,JSON.stringify({screen:screen.id,width,scale,reflow}));
    layouts++;
   }
  }
 }
 checks.push('96_layouts_320_360_390_768_text_100_200');
 await reload(); await view('child','UI02','reduced');
 const reduced=await product.locator('.choices label').first().evaluate(n=>getComputedStyle(n).transitionDuration);
 assert.equal(reduced,'0s');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.getByLabel('状態',{exact:true}).selectOption('normal');
 assert.equal(await product.locator('.choices label').first().evaluate(n=>getComputedStyle(n).transitionDuration),'0s');
 checks.push('profile_or_os_reduced_motion');
 assert.equal(pageErrors.length,0,JSON.stringify(pageErrors));
 assert(requests.every(url=>url==='http://ui-review.invalid/'),JSON.stringify(requests));
 checks.push('no_runtime_errors_no_external_requests');
 // Exact vector drawings are rendered by Chromium; return compact metadata
 // plus the public synthetic PNG bytes so the review can be displayed.
 const pngs=[];
 for(const name of ['sharing','money','grandparent']){
  const svg=await readFile(path.join(root,'docs/review/ui-20261007',name+'.svg'),'utf8');
  const svgPage=await context.newPage();
  const dimensions=svg.match(/width="([^"]+)" height="([^"]+)"/);
  await svgPage.setViewportSize({width:Math.ceil(Number(dimensions[1])),height:Math.ceil(Number(dimensions[2]))});
  await svgPage.setContent('<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>body{margin:0}</style></head><body>'+svg+'</body></html>');
  await svgPage.evaluate(()=>document.fonts.ready);
  const png=await svgPage.screenshot({fullPage:true});
  await writeFile(path.join(output,name+'.png'),png);
  pngs.push({name,width:Math.ceil(Number(dimensions[1])),height:Math.ceil(Number(dimensions[2])),bytes:png.length});
  console.log('UI_REVIEW_PNG_BASE64:'+name+':'+png.toString('base64'));
  await svgPage.close();
 }
 const evidence={scope:'synthetic_design_review_only',checks,layouts,screens:12,pngs,productImplementation:'not_started',realUsers:'not_tested'};
 await writeFile(path.join(output,'verification.json'),JSON.stringify(evidence,null,2)+'\n');
 console.log('UI_REVIEW_VERIFIED:'+JSON.stringify(evidence));
} finally {await browser.close();}
