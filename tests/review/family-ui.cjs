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
async function rawSay(page,text) {await page.locator('#input').fill(text);await page.locator('#send').click();}
async function confirmReport(page,text) {
  const id=await page.evaluate(()=>scene);
  if(await page.locator(`[data-cycle="actual:${id}"]`).count())await action(page,`actual:${id}`);
  await page.locator('#executionReport').fill(text);await action(page,`confirmexecution:${id}`);
}
async function say(page, text) {
  await rawSay(page,text);
  // Scripted self-reports require the same explicit confirmation as the user.
  if(await page.locator('#executionReport').count())await confirmReport(page,text);
}
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
const evidence=path.resolve(__dirname,'../../docs/review/family-ui-handoff-20261008/evidence/usability-fixes');
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
    assert.equal(await p.evaluate(()=>states.research.done),false);
    assert.equal(await p.evaluate(()=>cyActivityReady('research')),false);
    await confirmReport(p,research.at(-1));
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
      if(i===10){
        assert.equal(await p.evaluate(()=>cyActivityReady('dinner')),false);
        await confirmReport(p,'A店で400gの肉とじゃがいもとトマトを980円で買った。父と帰り、親とカレーを作った');
      }
      if(i===8){await p.locator('#result h2').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(evidence,`child-${width}.png`)});}
    }
    assert.equal(await p.evaluate(()=>states.dinner.done),true);
    // The suggested reflection is a sample; the child edits it into a self-report.
    await p.locator('#editLast').click();await say(p,'B店は安かったけど、父の迎えに合うA店を選んだ。次は2日分なら大きい肉も考えたい');
    assert.match(await p.locator('#result').innerText(),/次は2日分/);
    await p.locator('#result h2').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(evidence,`child-complete-${width}.png`)});
    await action(p,'report:dinner');await action(p,'save:dinner');await action(p,'share:dinner');
    await role(p,'parent');await p.screenshot({path:path.join(evidence,`parent-${width}.png`)});await action(p,'publish:dinner');await action(p,'award:dinner');
    assert.equal(await p.evaluate(()=>cyPoints()),60);await layout(p);
    await p.locator('[data-parent-tab=family]').click();await action(p,'issue');await action(p,'issue');
    assert.equal(await p.evaluate(()=>cycle.issues.length),1);
    await role(p,'grandparent');await p.locator('[data-grand-tab=today]').click();assert.equal(await p.locator('article.news').count(),2);
    assert.doesNotMatch(await p.locator('#familyMain').innerText(),/収入は40万円|家賃10万円|確定60P/);
    await p.screenshot({path:path.join(evidence,`grandparent-${width}.png`)});
    await action(p,'read:dinner');await p.locator('#reply-dinner').fill('私は余った肉を冷凍していました。');await action(p,'reply:dinner');
    await layout(p);
    await p.locator('[data-grand-tab=archive]').click();await p.locator('#articleDate').selectOption(await p.evaluate(()=>today()));
    await p.locator('#familyMain details summary').click();assert.match(await p.locator('#familyMain').innerText(),/次は2日分/);await layout(p);
    await p.locator('[data-grand-tab=status]').click();await p.locator('#gpost').fill('元気だよ。散歩を楽しんだよ。');await p.locator('#gsteps').fill('5200');
    await p.locator('#recipient-child').check();await action(p,'previewpost');assert.equal(await p.evaluate(()=>cycle.posts.length),0);await layout(p);await action(p,'post');
    await role(p,'child');await p.locator('#inboxFold summary').click();assert.match(await p.locator('#familyInbox').innerText(),/散歩を楽しんだ|冷凍/);
    await p.locator('[data-cycle^="seed:"]').first().click();
    await p.locator('#seedQuestion').fill('余った材料は今どう保存する？');await p.locator('#seedMethod').selectOption('家族に聞く');
    await action(p,'beginseed');const followupId=await p.evaluate(()=>scene);
    assert.equal(await p.evaluate(()=>states[scene].done),false);
    await say(p,'家族に聞いた。余った材料は親と確認して保存することにした。');
    assert.equal(await p.evaluate(()=>states[scene].done),true);await action(p,'save:'+followupId);
    const origin=await p.evaluate(()=>cycle.records[scene].source);
    assert.equal(origin.article,'dinner');assert.ok(origin.replyId);
    assert.equal(await p.evaluate(()=>cycle.share[scene]),'private');assert.equal(await p.evaluate(()=>cyPoints()),60);
    await role(p,'grandparent');await p.locator('[data-grand-tab=today]').click();assert.equal(await p.locator('article.news').count(),2);
    await role(p,'child');await action(p,'share:'+followupId);await role(p,'parent');
    await p.locator('[data-parent-tab=checks]').click();await action(p,'publish:'+followupId);
    await role(p,'grandparent');await p.locator('[data-grand-tab=today]').click();assert.equal(await p.locator('article.news').count(),3);await layout(p);
    await role(p,'child');
    await p.locator('#result h2').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(evidence,`followup-${width}.png`)});
    await p.locator('#rewardFold summary').click();await action(p,'request');assert.equal(await p.evaluate(()=>cyFree()),10);
    await action(p,'cancel');assert.equal(await p.evaluate(()=>cyFree()),60);await action(p,'request');
    await role(p,'parent');
    assert.match(await p.locator('.parentOverview').innerText(),/ごほうび 1件/);
    assert.equal(await p.locator('[data-cycle=approve]').count(),1);
    await p.screenshot({path:path.join(evidence,`reward-inbox-${width}.png`)});
    await action(p,'approve');assert.equal(await p.evaluate(()=>cycle.pointsUsed),'approved');
    assert.equal(await p.locator('[data-cycle=deliver]').count(),1);assert.match(await p.locator('.parentOverview').innerText(),/ごほうび 1件/);
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
  await p.locator('#gsteps').fill('0');await action(p,'previewpost');
  await p.evaluate(()=>{cycle.postText='文章を変えました'});await action(p,'post');assert.equal(await p.evaluate(()=>cycle.posts.length),0);
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
  assert.doesNotMatch(await p.locator('#familyInbox').innerText(),/元気だよ/);
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

test('話す例の実行文は完了・実行報告にならず、本人がまだを選べる',async()=>{
  const p=await pageFor();await quest(p,'research');await p.locator('#prompts button').first().click();
  for(let i=0;i<5;i++)await p.locator('#next button').first().click();
  assert.match(await p.locator('#history > .child').innerText(),/話す例/);
  assert.equal(await p.evaluate(()=>states.research.done),false);assert.equal(await p.evaluate(()=>cyActivityReady('research')),false);
  await p.locator('.executionCheck').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(evidence,'execution-example-390.png')});
  await p.evaluate(()=>cycleAction('report:research'));assert.equal(await p.evaluate(()=>cycle.award.research),'none');
  await action(p,'actual:research');assert.equal(await p.locator('#executionReport').inputValue(),'');
  await action(p,'confirmexecution:research');assert.equal(await p.evaluate(()=>states.research.done),false);
  await action(p,'notyet:research');assert.equal(await p.evaluate(()=>states.research.pendingExecution),null);
  assert.equal(await p.evaluate(()=>states.research.phase),'trial');assert.equal(await p.evaluate(()=>cyPoints()),0);await p.close();
});

test('本人の報告も内容確認まで完了せず、否定した確認文では止まる',async()=>{
  const p=await pageFor();await quest(p,'research');for(const t of research.slice(0,-1))await say(p,t);
  await rawSay(p,research.at(-1));assert.equal(await p.evaluate(()=>states.research.done),false);
  assert.equal(await p.evaluate(()=>states.research.facts.executionText),undefined);
  await p.locator('#executionReport').fill('父に伝えたつもり。実際にはまだ伝えていない');await action(p,'confirmexecution:research');
  assert.equal(await p.evaluate(()=>cyActivityReady('research')),false);
  await confirmReport(p,research.at(-1));assert.equal(await p.evaluate(()=>states.research.done),true);
  assert.equal(await p.evaluate(()=>states.research.facts.executionConfirmed),true);
  assert.equal(await p.evaluate(()=>cyPoints()),0);await p.close();
});

test('保存後は共有選択が全文より先にあり、全文は閉じたまま読める',async()=>{
  const p=await pageFor();await quest(p,'research');for(const t of research)await say(p,t);await action(p,'save:research');
  const details=p.locator('#albumFold .recordDetail');assert.equal(await details.evaluate(e=>e.open),false);
  const order=await p.evaluate(()=>document.querySelector('#share-research').compareDocumentPosition(document.querySelector('.recordDetail'))&Node.DOCUMENT_POSITION_FOLLOWING);
  assert.ok(order);assert.doesNotMatch(await p.locator('#albumFold').innerText(),/収入は40万円/);
  await p.locator('#share-research').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(evidence,'album-compact-390.png')});
  await details.locator('summary').click();assert.match(await details.innerText(),/収入は40万円/);
  assert.equal(await p.evaluate(()=>cycle.share.research),'private');await p.close();
});

test('親と祖父母の選択タブは色・枠と属性で区別できる',async()=>{
  const p=await pageFor();for(const r of ['parent','grandparent']){
    await role(p,r);const tabs=p.locator('.parentTabs button');
    const before=await tabs.evaluateAll(els=>els.map(e=>({pressed:e.getAttribute('aria-pressed'),bg:getComputedStyle(e).backgroundColor,border:getComputedStyle(e).borderWidth})));
    assert.notEqual(before[0].bg,before[1].bg);assert.notEqual(before[0].border,before[1].border);
    await tabs.nth(1).click();assert.equal(await tabs.nth(1).getAttribute('aria-pressed'),'true');assert.equal(await tabs.nth(0).getAttribute('aria-pressed'),'false');
  }await p.close();
});

test('模擬返答の180ms表示は即返答と両立し、動き低減では停止する',async()=>{
  const p=await pageFor();await p.emulateMedia({reducedMotion:'no-preference'});await p.locator('#prompts button').first().click();
  assert.equal(await p.locator('.bubble.ai').count(),1);
  const style=await p.locator('.reply-enter').evaluate(e=>({name:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration}));
  assert.equal(style.name,'replyArrival');assert.equal(style.duration,'0.18s');
  await p.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await p.locator('.reply-enter').evaluate(e=>getComputedStyle(e).animationName),'none');
  assert.equal(await p.locator('#main').evaluate(e=>getComputedStyle(e).scrollBehavior),'auto');
  assert.equal(await p.locator('.bubble.ai').count(),1);assert.match(await p.locator('#status').innerText(),/模擬AIが返答/);await p.close();
});

test('通常・動き低減と4画面幅で最新発言の冒頭が欠けず、保存で会話を描き直さない',async()=>{
  for(const width of [320,390,768,1440])for(const motion of ['no-preference','reduce']){
    const p=await pageFor(width,width<768?844:900);await p.emulateMedia({reducedMotion:motion});await quest(p,'family');await p.locator('#prompts button').first().click();
    await p.waitForFunction(()=>{const r=document.querySelector('#history > .child').getBoundingClientRect(),m=document.querySelector('#main').getBoundingClientRect();return r.top>=m.top&&r.top<m.top+24&&r.bottom<=m.bottom});
    if(width===390&&motion==='no-preference')await p.screenshot({path:path.join(evidence,'child-first-reply-390.png')});
    await p.locator('#history > .child').evaluate(e=>e.dataset.positionMarker='same');
    await action(p,'save:family');assert.equal(await p.locator('#history > .child').getAttribute('data-position-marker'),'same');
    assert.deepEqual(p.errors,[]);await p.close();
  }
});

test('祖父母の確認は別画面で見出しにfocusし、修正で入力と位置が戻る',async()=>{
  const p=await pageFor();await role(p,'grandparent');await p.locator('[data-grand-tab=status]').click();
  await p.locator('#gpost').fill('元気だよ。今日は散歩しました。');await p.locator('#gsteps').fill('5200');await p.locator('#recipient-child').check();
  await p.locator('[data-cycle=previewpost]').scrollIntoViewIfNeeded();const scroll=await p.locator('#familyMain').evaluate(e=>e.scrollTop);
  await action(p,'previewpost');assert.equal(await p.locator('#gpost').count(),0);assert.equal(await p.evaluate(()=>document.activeElement.id),'postPreviewHeading');
  assert.equal(await p.evaluate(()=>cycle.posts.length),0);
  const bounds=await p.locator('[data-cycle=post]').boundingBox();assert.ok(bounds.y>=140&&bounds.y+bounds.height<=844,JSON.stringify(bounds));
  fs.mkdirSync(evidence,{recursive:true});await p.screenshot({path:path.join(evidence,'grandparent-preview-390.png')});
  await action(p,'editpost');assert.equal(await p.locator('#gpost').inputValue(),'元気だよ。今日は散歩しました。');assert.equal(await p.locator('#gsteps').inputValue(),'5200');
  assert.equal(await p.locator('#recipient-child').isChecked(),true);assert.equal(await p.locator('#familyMain').evaluate(e=>e.scrollTop),scroll);
  await p.locator('#recipient-child').uncheck();await action(p,'previewpost');await action(p,'post');await p.evaluate(()=>cycleAction('post'));
  assert.equal(await p.evaluate(()=>cycle.posts.length),1);assert.deepEqual(await p.evaluate(()=>cycle.posts[0].recipients),['parent']);await p.close();
});

async function makeReply(p) {
  await say(p,'カレーを作りたい');await action(p,'save:dinner');await action(p,'share:dinner');await role(p,'parent');await action(p,'publish:dinner');
  await role(p,'grandparent');await p.locator('#reply-dinner').fill('余った材料は次の日にも使っていました。');await action(p,'reply:dinner');
  return await p.evaluate(()=>cycle.replies.at(-1).id);
}
test('返信をあとで読む・別の問いを選ぶ・途中再開ができ、自動共有やポイントはない',async()=>{
  const p=await pageFor();const id=await makeReply(p);await role(p,'child');await p.locator('#inboxFold summary').click();await action(p,'laterreply:'+id);
  assert.match(await p.locator('#familyInbox').innerText(),/あとで読むことに/);await action(p,'reopenreply:'+id);
  await action(p,'ownseed');await p.locator('#seedQuestion').fill('台所にはどんな準備がある？');await p.locator('#seedMethod').selectOption('親と一緒に観察する');await action(p,'beginseed');
  const next=await p.evaluate(()=>scene);assert.equal(await p.evaluate(()=>states[scene].source),null);assert.equal(await p.evaluate(()=>states[scene].done),false);
  await quest(p,'dinner');await action(p,'start:'+next);assert.match(await p.locator('#title').innerText(),/台所/);
  await say(p,'親と見た。料理の前に材料と道具を準備していた。');await action(p,'save:'+next);
  assert.equal(await p.evaluate(()=>cycle.records[scene].done),true);assert.equal(await p.evaluate(()=>cycle.share[scene]),'private');assert.equal(await p.evaluate(()=>cyPoints()),0);await p.close();
});
test('元返信の撤回と記事の版更新では、選びかけの次の問いを始めない',async()=>{
  for(const change of ['reply','article']){
    const p=await pageFor();const id=await makeReply(p);await role(p,'child');await p.locator('#inboxFold summary').click();await action(p,'seed:'+id);await p.locator('#seedQuestion').fill('今の保存方法を聞きたい');
    if(change==='reply'){await role(p,'grandparent');await action(p,'withdrawreply:'+id);await role(p,'child')}
    else{await say(p,'家族に聞いた。4人分で予算は1000円。調理は親と一緒にする');await action(p,'save:dinner')}
    await action(p,'beginseed');assert.equal(await p.evaluate(()=>cycle.followups.length),0);assert.equal(await p.evaluate(()=>cycle.seedDraft),null);
    await p.evaluate(id=>cycleAction('seed:'+id),id);assert.equal(await p.evaluate(()=>cycle.seedDraft),null);await p.close();
  }
});
test('返信なしでも自分の問いから進め、返信の採用は本人が選ぶまで起きない',async()=>{
  const p=await pageFor();await p.locator('#inboxFold summary').click();await action(p,'ownseed');await action(p,'beginseed');assert.equal(await p.evaluate(()=>cycle.followups.length),0);
  await p.locator('#seedQuestion').fill('夕飯前に何をしている？');
  await action(p,'cancelseed');assert.equal(await p.evaluate(()=>cycle.followups.length),0);
  await action(p,'resumeseed');assert.equal(await p.locator('#seedQuestion').inputValue(),'夕飯前に何をしている？');await action(p,'beginseed');
  await say(p,'まだ家族に聞いていない');assert.equal(await p.evaluate(()=>states[scene].done),false);
  await say(p,'家族に聞いた。材料と道具を確認していると分かった。');await action(p,'save:'+await p.evaluate(()=>scene));
  assert.equal(await p.evaluate(()=>cycle.followups.length),1);assert.equal(await p.evaluate(()=>visibleArticles().length),0);assert.equal(await p.evaluate(()=>cyPoints()),0);await p.close();
});
test('採用済みの返信を撤回しても本人の記録は私的に残り、出所の失効が分かる',async()=>{
  const p=await pageFor();const replyId=await makeReply(p);await role(p,'child');await p.locator('#inboxFold summary').click();
  await action(p,'seed:'+replyId);await p.locator('#seedQuestion').fill('今の材料の保存方法を聞きたい');await action(p,'beginseed');const next=await p.evaluate(()=>scene);
  await say(p,'親に聞いた。保存方法は材料ごとに確認していると分かった。');await action(p,'save:'+next);
  const record=await p.evaluate(()=>cycle.records[scene]);assert.equal(record.source.replyId,replyId);assert.equal(record.source.version,1);
  await role(p,'grandparent');await action(p,'withdrawreply:'+replyId);await role(p,'child');
  assert.equal(await p.evaluate(()=>cycle.records[scene].done),true);assert.equal(await p.evaluate(()=>cycle.share[scene]),'private');
  assert.match(await p.locator('#albumFold').innerText(),/元の返信は現在取り下げ/);
  await p.evaluate(id=>cycleAction('seed:'+id),replyId);assert.equal(await p.evaluate(()=>cycle.seedDraft),null);
  assert.equal(await p.evaluate(()=>cycle.posts.length),0);await p.close();
});
test('振り返りの例を本人の考えとして共有下書きへ転記しない',async()=>{
  const p=await pageFor();await p.locator('#prompts button').first().click();for(let i=0;i<10;i++)await p.locator('#next button').first().click();
  await say(p,'肉を買った。親とカレーを作った');await p.locator('#next button').first().click();await action(p,'save:dinner');
  assert.equal(await p.evaluate(()=>cycle.records.dinner.factSources.reflectionText),'example');
  assert.doesNotMatch(await p.locator('#share-dinner').inputValue(),/B店|次は2日分|本人が考えたこと/);
  assert.match(await p.locator('#share-dinner').inputValue(),/肉を買った/);
  await p.locator('#editLast').click();await say(p,'必要な量を選ぶことが大事だと思った');await action(p,'save:dinner');
  assert.equal(await p.evaluate(()=>cycle.records.dinner.factSources.reflectionText),'reported');
  assert.match(await p.locator('#share-dinner').inputValue(),/本人が考えたこと：必要な量/);await p.close();
});
