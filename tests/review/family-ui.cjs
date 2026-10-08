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
  browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args:['--no-sandbox']});
});
after(async () => {await browser?.close(); server?.close();});
async function pageFor(width=390, height=844) {
  const page = await browser.newPage({viewport:{width, height}, reducedMotion:'reduce'});
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
