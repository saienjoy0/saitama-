const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
let browser, server, url;
before(async () => {
  const root = path.resolve(__dirname, '../../docs/review/family-ui-handoff-20261008');
  server = http.createServer((req, res) => {
    const name = req.url === '/' ? 'index.html' : req.url.slice(1);
    if (!['index.html', 'baseline-upload.html'].includes(name)) {res.writeHead(404); return res.end();}
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(fs.readFileSync(path.join(root, name)));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : chromium.executablePath()), args:['--no-sandbox']});
});
after(async () => {await browser?.close(); server?.close();});
async function pageFor(width=390, height=844) {
  const page = await browser.newPage({viewport:{width, height}, isMobile:width<768, hasTouch:width<768, reducedMotion:'reduce'});
  page.setDefaultTimeout(4000);
  page.errors = []; page.on('pageerror', e => page.errors.push(e.message));
  await page.goto(url); return page;
}
async function say(page, text) {await page.locator('#input').fill(text); await page.locator('#send').click();}
async function quest(page, id) {await page.locator('#choose').click(); await page.locator(`[data-scene=${id}]`).click();}
async function role(page, id) {await page.locator(`[data-role=${id}]`).click();}
async function action(page, cmd) {await page.locator(`[data-cycle="${cmd}"]`).click();}
const family = [
  '献立を自分で決めたい',
  '母が在庫を確認して、父が買い物をしていると聞いた',
  '親に聞いた。献立は自分で決めていい。予算と道は相談、調理は一緒にする',
  'この約束でいい。まず家の仕事を調べてみたい',
];
const research = [
  '買い物に行くこと',
  '家族に聞いた。在庫を調べて献立を考えてから買い物をしていた',
  '収入は40万円、家賃10万円、食費7万円、光熱費2万円だと聞いた',
  '父は店に行くまで在庫が分からないから、買い物前に知らせたい',
  '父に相談した。店に入った後では遅いので出発前に知らせる約束をした',
  '出発前に親と米と玉ねぎとルーを確認して父に伝えた',
];
test('話す例の1タップで発言と模擬AI返答が表示される', async () => {
  const p = await pageFor(); await p.locator('#prompts button').first().click();
  assert.equal(await p.locator('.bubble.child').count(), 1);
  assert.equal(await p.locator('.bubble.ai').count(), 1);
  assert.equal(await p.locator('#input').inputValue(), ''); await p.close();
});
test('親子の約束を本人が確認し、最初の挑戦へ到達する', async () => {
  const p = await pageFor(); await quest(p, 'family'); for (const text of family) await say(p, text);
  assert.equal(await p.evaluate(() => states.family.done), true); await p.close();
});
test('調査は提案から家族との調整、実行報告まで進む', async () => {
  const p = await pageFor(); await quest(p, 'research'); for (const text of research) await say(p, text);
  assert.equal(await p.evaluate(() => states.research.done), true);
  assert.match(await p.locator('#result').innerText(), /実際|報告/); await p.close();
});
test('買っていない・作っていない報告を実行済みにしない', async () => {
  const p = await pageFor(); await p.evaluate(() => {states.dinner.phase = 'execute';});
  await say(p, '買ったわけではない。まだ作っていない。');
  assert.equal(await p.evaluate(() => !!states.dinner.facts.executionText), false); await p.close();
});
test('途中保存した内容は、その後の会話で書き換わらない', async () => {
  const p=await pageFor(); await say(p,'カレーを作りたい'); await action(p,'save:dinner');
  const saved=await p.locator('#cycleAlbum .familyBox').first().innerText();
  await say(p,'家族に聞いた。4人分で予算は1000円。調理は親と一緒にする');
  assert.equal(await p.locator('#cycleAlbum .familyBox').first().innerText(), saved); await p.close();
});
test('調査の実行確認はアルバム保存と共有に依存しない', async () => {
  const p=await pageFor(); await quest(p,'research'); for(const t of research) await say(p,t);
  await action(p,'report:research'); await role(p,'parent'); await action(p,'award:research');
  assert.equal(await p.evaluate(()=>cyPoints()),20);
  await p.evaluate(()=>cycleAction('award:research')); assert.equal(await p.evaluate(()=>cyPoints()),20);
  assert.equal(await p.evaluate(()=>cycle.save.research),false); await p.close();
});
test('希望を話しただけでは保護者は任せ方を承認できない', async () => {
  const p=await pageFor(); await quest(p,'family'); await say(p,family[0]); await role(p,'parent');
  assert.equal(await p.locator('[data-cycle=agree]').count(),0); await p.close();
});
async function layout(p) {
  const info=await p.evaluate(()=>{
    const main=cycle.role==='child'?$('main'):$('familyMain'); main.scrollTop=main.scrollHeight;
    const rect=main.getBoundingClientRect(),dock=$('childDock').getBoundingClientRect();
    const last=main.lastElementChild.getBoundingClientRect();
    return {width:innerWidth,docWidth:document.documentElement.scrollWidth,mainWidth:main.clientWidth,scrollWidth:main.scrollWidth,
      bottom:rect.bottom,dockTop:dock.top,child:cycle.role==='child',tail:last.bottom,errors:[]};
  });
  assert.ok(info.docWidth<=info.width, JSON.stringify(info));
  assert.ok(info.scrollWidth<=info.mainWidth+1,JSON.stringify(info));
  if(info.child)assert.ok(info.bottom<=info.dockTop+1,JSON.stringify(info));
  assert.ok(info.tail<=info.bottom+1,JSON.stringify(info));
  assert.deepEqual(p.errors,[]);
}
const evidence=path.resolve(__dirname,'../../docs/review/family-ui-handoff-20261008/evidence');
for(const [width,height] of [[320,568],[390,844],[768,1024],[1440,900]]) {
  test(`${width}px: 3体験→保護者→新聞・返信・近況→60P・カフェを完走`,async()=>{
    const p=await pageFor(width,height);
    fs.mkdirSync(evidence,{recursive:true});
    // All quest steps are real button taps; there is no injected completed state.
    await quest(p,'family'); await p.locator('#prompts button').first().click();
    for(let i=0;i<3;i++)await p.locator('#next button').first().click();
    await layout(p);assert.equal(await p.evaluate(()=>states.family.done),true);
    await action(p,'save:family');
    await role(p,'parent');await action(p,'agree');
    assert.equal(await p.evaluate(()=>cycle.agreement),'confirmed');await layout(p);
    await role(p,'child');await action(p,'start:research');
    await p.locator('#prompts button').first().click();
    for(let i=0;i<5;i++)await p.locator('#next button').first().click();
    assert.equal(await p.evaluate(()=>states.research.done),true);await layout(p);
    await action(p,'report:research');await action(p,'save:research');
    await action(p,'share:research');
    await role(p,'grandparent');assert.equal(await p.locator('article.news').count(),0);
    await role(p,'parent');
    // The parent edits real text. Editing invalidates the child's prior consent.
    await p.locator('#edit-research').fill('はるは「出発前に材料を確認して父に伝えた」と報告しました。');
    await action(p,'return:research');assert.equal(await p.locator('[data-cycle="publish:research"]').count(),0);
    await role(p,'child');if(!await p.locator('#albumFold').evaluate(el=>el.open))await p.locator('#albumFold summary').click();await action(p,'resubmit:research');
    await role(p,'parent');await action(p,'publish:research');
    assert.equal(await p.evaluate(()=>cyPoints()),0);await action(p,'award:research');
    await role(p,'child');await action(p,'start:dinner');
    await p.locator('#prompts button').first().click();
    for(let i=0;i<12;i++){
      await p.locator('#next button').first().click();await layout(p);
      if(i===8){await p.locator('#result h2').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(evidence,`child-${width}.png`)});}
    }
    assert.equal(await p.evaluate(()=>states.dinner.done),true);
    assert.match(await p.locator('#result').innerText(),/次は2日分/);
    await p.locator('#result h2').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(evidence,`child-complete-${width}.png`)});
    await action(p,'report:dinner');await action(p,'save:dinner');await action(p,'share:dinner');
    await role(p,'parent');await p.screenshot({path:path.join(evidence,`parent-${width}.png`)});await action(p,'publish:dinner');await action(p,'award:dinner');
    assert.equal(await p.evaluate(()=>cyPoints()),60);await layout(p);
    await p.locator('[data-parent-tab=family]').click();await action(p,'issue');await action(p,'issue');
    assert.equal(await p.evaluate(()=>cycle.issues.length),1);
    await role(p,'grandparent');assert.equal(await p.locator('article.news').count(),2);
    assert.doesNotMatch(await p.locator('#familyMain').innerText(),/収入は40万円|家賃10万円|確定60P/);
    await p.screenshot({path:path.join(evidence,`grandparent-${width}.png`)});
    await action(p,'read:dinner');await p.locator('#reply-dinner').fill('私は余った肉を冷凍していました。');await action(p,'reply:dinner');
    await layout(p);
    await p.locator('[data-grand-tab=archive]').click();await p.locator('#articleDate').selectOption(await p.evaluate(()=>today()));
    await p.locator('#familyMain details summary').click();assert.match(await p.locator('#familyMain').innerText(),/次は2日分/);await layout(p);
    await p.locator('[data-grand-tab=status]').click();await p.locator('#gpost').fill('元気だよ。散歩を楽しんだよ。');await p.locator('#gsteps').fill('5200');
    await p.locator('#recipient-child').check();await action(p,'previewpost');assert.equal(await p.evaluate(()=>cycle.posts.length),0);await action(p,'post');
    await role(p,'child');assert.match(await p.locator('#cycleAlbum').innerText(),/散歩を楽しんだ|冷凍/);
    await p.locator('#rewardFold summary').click();await action(p,'request');assert.equal(await p.evaluate(()=>cyFree()),10);
    await action(p,'cancel');assert.equal(await p.evaluate(()=>cyFree()),60);await action(p,'request');
    await role(p,'parent');await action(p,'approve');assert.equal(await p.evaluate(()=>cycle.pointsUsed),'approved');
    await action(p,'refund');assert.equal(await p.evaluate(()=>cyFree()),60);
    await role(p,'child');await action(p,'request');await role(p,'parent');await action(p,'reject');assert.equal(await p.evaluate(()=>cyFree()),60);
    await role(p,'child');await action(p,'request');await role(p,'parent');await action(p,'approve');await action(p,'deliver');
    await p.evaluate(()=>{cycleAction('deliver');cycleAction('award:dinner')});assert.equal(await p.evaluate(()=>cyFree()),10);
    await role(p,'child');assert.match(await p.locator('#rewardFold').innerText(),/提供を保護者が確認済み/);
    await layout(p); await p.close();
  });
}
test('文面更新・撤回で公開と過去新聞号から旧版を取り除く',async()=>{
  const p=await pageFor();await say(p,'カレーを作りたい');await action(p,'save:dinner');await action(p,'share:dinner');
  await role(p,'parent');await action(p,'publish:dinner');await p.locator('[data-parent-tab=family]').click();await action(p,'issue');
  await role(p,'child');await say(p,'家族に聞いた。4人分で予算は1000円。調理は親と一緒にする');await action(p,'save:dinner');
  await role(p,'grandparent');assert.equal(await p.locator('article.news').count(),0);
  await p.locator('[data-grand-tab=archive]').click();await p.locator('#familyMain details').evaluate(el=>el.open=true);
  assert.equal(await p.locator('#familyMain details h3').count(),0);
  await role(p,'child');await action(p,'share:dinner');await role(p,'parent');await p.locator('[data-parent-tab=checks]').click();await action(p,'publish:dinner');
  await role(p,'child');await action(p,'withdraw:dinner');await role(p,'grandparent');assert.equal(await p.locator('article.news').count(),0);await p.close();
});
test('内容版・宛先の競合や異なる役割からの操作では公開しない',async()=>{
  const p=await pageFor();await say(p,'カレーを作りたい');await action(p,'save:dinner');await action(p,'share:dinner');
  await p.evaluate(()=>cycleAction('publish:dinner'));assert.equal(await p.evaluate(()=>cycle.share.dinner),'requested');
  await role(p,'parent');await p.evaluate(()=>{cycle.consents.dinner.version--;cycleAction('publish:dinner')});
  assert.equal(await p.evaluate(()=>visibleArticles().length),0);
  await p.evaluate(()=>{cycle.consents.dinner.version=cycle.versions.dinner;cycle.consents.dinner.recipient='other';cycleAction('publish:dinner')});
  assert.equal(await p.evaluate(()=>visibleArticles().length),0);await p.close();
});
test('否定・未来の実行報告、振り返りを省く、未確認の価格を捏造しない',async()=>{
  const p=await pageFor();
  await p.evaluate(()=>{states.dinner.phase='execute'});
  for(const t of ['買ったけど作らなかった','買ったら料理する予定','買ってないけど作った','買った、作ったと言うつもり','買っていないし調理したわけではない']){
    await say(p,t);assert.equal(await p.evaluate(()=>cyActivityReady('dinner')),false,t);
  }
  await say(p,'肉を買った。親とカレーを作った');
  assert.equal(await p.evaluate(()=>cyActivityReady('dinner')),true);
  await action(p,'report:dinner');await say(p,'振り返りは後にする');assert.equal(await p.evaluate(()=>states.dinner.done),true);
  assert.equal(await p.evaluate(()=>states.dinner.facts.reflectionText),undefined);
  await p.reload();await p.evaluate(()=>{states.dinner.phase='prices'});await say(p,'お店の値段を調べた');
  assert.doesNotMatch(await p.locator('#result').innerText(),/980円|920円/);await p.close();
});
test('空の共有・返信・近況、負の歩数、確認後の変更を送信しない',async()=>{
  const p=await pageFor();await say(p,'カレーを作りたい');await action(p,'save:dinner');await p.locator('#share-dinner').fill('');await action(p,'share:dinner');
  assert.equal(await p.evaluate(()=>cycle.share.dinner),'private');
  await p.locator('#share-dinner').fill('本人の途中記録');await action(p,'share:dinner');await role(p,'parent');await action(p,'hold:dinner');
  await role(p,'child');await action(p,'share:dinner');await role(p,'parent');await action(p,'publish:dinner');
  await role(p,'grandparent');await action(p,'reply:dinner');assert.equal(await p.evaluate(()=>cycle.replies.length),0);
  await p.locator('[data-grand-tab=status]').click();await action(p,'previewpost');assert.equal(await p.evaluate(()=>cycle.postDraft),null);
  await p.locator('#gpost').fill('元気だよ');await p.locator('#gsteps').fill('-1');await action(p,'previewpost');assert.equal(await p.evaluate(()=>cycle.postDraft),null);
  await p.locator('#gsteps').fill('0');await action(p,'previewpost');await p.locator('#gpost').fill('文章を変えました');await action(p,'post');assert.equal(await p.evaluate(()=>cycle.posts.length),0);
  await action(p,'previewpost');await action(p,'post');assert.equal(await p.evaluate(()=>cycle.posts[0].steps),0);await p.close();
});
test('320pxの短い表示高・文字200%でもドックは会話を覆わない',async()=>{
  const p=await pageFor(320,460);await say(p,'カレーを作りたい');
  await p.addStyleTag({content:'p,button,summary,span,textarea{font-size:200% !important}'});
  await layout(p);await p.locator('#choose').click();await p.keyboard.press('Escape');assert.equal(await p.locator('#menu').isVisible(),false);
  await p.locator('#input').fill('家族に聞いた。4人分で予算は1000円。調理は親と一緒にする');await p.locator('#input').press('Control+Enter');
  assert.equal(await p.evaluate(()=>states.dinner.phase),'stock');await layout(p);await p.close();
});
test('祖父母は私的記録と宛先を選べ、孫へ自動共有しない',async()=>{
  const p=await pageFor();await role(p,'grandparent');await p.locator('[data-grand-tab=status]').click();
  await action(p,'ready');assert.equal(await p.locator('#gpost').inputValue(),'元気だよ');
  await action(p,'savestatus');assert.equal(await p.evaluate(()=>cycle.statusRecords.length),1);assert.equal(await p.evaluate(()=>cycle.posts.length),0);
  await action(p,'previewpost');await action(p,'post');await role(p,'child');
  assert.doesNotMatch(await p.locator('#cycleAlbum').innerText(),/元気だよ/);
  await role(p,'parent');await p.locator('[data-parent-tab=family]').click();assert.match(await p.locator('#familyMain').innerText(),/元気だよ/);await p.close();
});
test('別の料理でもカレーの材料や経験を事実として補わず、結果まで進める',async()=>{
  const p=await pageFor();await say(p,'シチューにしたい');
  await say(p,'家族に聞いた。4人分で予算は1000円。調理は親と一緒にする');
  await say(p,'レシピを確認したい');await say(p,'家族とレシピを確認した。家にある物以外の必要な材料と量をメモに書いた');
  await say(p,'必要な材料はA店980円、B店920円だった');
  await say(p,'A店にする。予算内で早く帰れるから。父もA店なら迎えられると言ってくれた');
  await say(p,'A店で必要な材料を買った。親とシチューを作った');
  assert.equal(await p.evaluate(()=>cyActivityReady('dinner')),true);
  assert.equal(await p.evaluate(()=>states.dinner.facts.schoolCurryExperience),undefined);await p.close();
});
test('家計を聞いた途中記録から給与・家賃を新聞へ自動転記しない',async()=>{
  const p=await pageFor();await quest(p,'research');for(const t of research.slice(0,3))await say(p,t);
  await action(p,'save:research');assert.equal(await p.locator('#share-research').inputValue(),'');
  await action(p,'share:research');assert.equal(await p.evaluate(()=>cycle.share.research),'private');await p.close();
});
test('最後の発言の訂正で条件を再計算し、公開は更新後に再承認する',async()=>{
  const p=await pageFor();await say(p,'カレーを作りたい');await say(p,'家族に聞いた。4人分で予算は1000円。調理は親と一緒にする');
  await action(p,'save:dinner');await action(p,'share:dinner');await role(p,'parent');await action(p,'publish:dinner');await role(p,'child');
  await p.locator('#editLast').click();await say(p,'家族に聞いた。3人分で予算は800円。調理は親と一緒にする');
  assert.equal(await p.evaluate(()=>states.dinner.facts.people),3);assert.equal(await p.evaluate(()=>states.dinner.facts.budget),800);
  assert.equal(await p.evaluate(()=>states.dinner.turns.length),2);await action(p,'save:dinner');
  assert.equal(await p.evaluate(()=>visibleArticles().length),0);await p.close();
});
