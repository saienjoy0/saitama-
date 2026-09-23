import { test, expect, type Page } from '@playwright/test';

const role=(p:Page,name:string)=>p.getByRole('button',{name,exact:true}).click();
async function record(p:Page,share=true,photo=false){
 await p.getByRole('button',{name:'これを調べてみる'}).click();
 await p.getByLabel('調べる前は、どう思う？').fill('5時間で10円くらいかな');
 await p.getByRole('button',{name:'何からやるか、一緒に考える'}).click();
 await p.getByLabel('AIのお手伝い体験を見てみる').check();
 await expect(p.getByText('まずは電球の数字を見つけよう。計算はそのあとで、一緒に試せるよ。')).toBeVisible();
 await p.getByRole('button',{name:'この順番でやってみる'}).click();
 await expect(p.locator('.cost-result')).toContainText('1.55');
 await p.getByLabel('電球の「W」を、おうちの人と見つける').check();
 await p.getByLabel('つける時間を変えて、金額を比べる').check();
 await p.getByRole('button',{name:'自分の発見を残す'}).click();
 await p.getByLabel('時間を変えて、気づいたことは？').fill('5時間で1.55円。時間を長くすると金額も増えた。');
 if(photo)await p.getByRole('button',{name:'電気のデモ写真',exact:true}).click();
 await p.getByRole('button',{name:'内容を確認する',exact:true}).click();
 if(share)await p.getByLabel('この記録を、おばあちゃんへの新聞にも載せていい').check();
 await p.getByRole('button',{name:'親に見せて、5ptをお願いする'}).click();
}
test.beforeEach(async({page})=>{await page.goto('/');});
test('小5の疑問→手順→発見→50pt→ごほうび→新聞配達→安否連絡',async({page})=>{
 await record(page,true,true);
 await expect(page.locator('.album-count')).toContainText('3');
 await role(page,'親');await page.getByRole('button',{name:'5ptを承認する',exact:true}).click();
 await page.getByRole('button',{name:'この内容の新聞掲載を認める',exact:true}).click();
 await role(page,'子ども');await page.getByRole('navigation').getByRole('button',{name:'おこづかい',exact:true}).click();
 await expect(page.getByTestId('wallet-balance')).toContainText('50');
 await page.getByRole('button',{name:'このごほうびへの交換をお願いする'}).click();
 await role(page,'親');await page.getByRole('navigation').getByRole('button',{name:'ごほうび・承認'}).click();
 await page.getByRole('button',{name:'50ptの交換を承認する'}).click();
 await expect(page.getByTestId('wallet-balance')).toHaveText('0pt');
 await page.getByRole('navigation').getByRole('button',{name:'新聞を届ける',exact:true}).click();
 await page.getByRole('button',{name:'この記録で新聞を作ってみる'}).click();
 await expect(page.locator('.family-paper')).not.toContainText('500円');
 await page.getByRole('button',{name:'この内容で新聞を届ける'}).click();
 await role(page,'祖父母');await page.getByRole('button',{name:'元気だよ',exact:true}).click();
 await page.getByRole('navigation').getByRole('button',{name:'おたより',exact:true}).click();
 await expect(page.locator('.family-paper')).toContainText('5時間で1.55円');
 await expect(page.locator('.family-paper img')).toHaveCount(2);
 await role(page,'親');await expect(page.locator('.welfare-card')).toContainText('元気だよ');
 await expect(page.locator('.welfare-card')).toContainText('3,240');
 await page.screenshot({path:'screenshots/automated/'+test.info().project.name+'-parent.png',fullPage:true});
});
test('写真なし・祖父母への共有なしでもポイントを獲得できる',async({page})=>{
 await record(page,false);await role(page,'親');await expect(page.locator('.approval-record img')).toHaveCount(0);
 await page.getByRole('button',{name:'5ptを承認する',exact:true}).click();await role(page,'子ども');
 await page.getByRole('navigation').getByRole('button',{name:'おこづかい',exact:true}).click();await expect(page.getByTestId('wallet-balance')).toHaveText('50pt');
 await role(page,'祖父母');await page.getByRole('navigation').getByRole('button',{name:'おたより',exact:true}).click();await expect(page.getByText('新聞は、まだ届いていません。')).toBeVisible();
});
test('子が継続増額を提案し、親が条件を承認する',async({page})=>{
 await page.getByRole('navigation').getByRole('button',{name:'おこづかい',exact:true}).click();
 await page.getByRole('button',{name:'自分のごほうびを提案する'}).click();
 await page.getByRole('button',{name:'毎月のおこづかい108円アップ',exact:true}).click();
 await page.getByRole('button',{name:'このごほうびを親に提案する'}).click();
 await expect(page.getByRole('button',{name:'このごほうびへの交換をお願いする'})).toBeDisabled();
 await role(page,'親');await page.getByRole('navigation').getByRole('button',{name:'ごほうび・承認'}).click();
 await expect(page.locator('.reward-card')).toContainText('10月からずっと');
 await page.getByRole('button',{name:'このごほうび・条件を承認する'}).click();await expect(page.locator('.reward-card')).toContainText('親子で決めた目標');
});
test('飲み物と請求額の体験も選択できる',async({page})=>{
 await page.getByRole('button',{name:/300円で、何を選ぶ/}).click();await page.getByLabel('調べる前は、どう思う？').fill('小さいほう');
 await page.getByRole('button',{name:'何からやるか、一緒に考える'}).click();await page.getByRole('button',{name:'この順番でやってみる'}).click();
 await page.getByRole('button',{name:'同じ量の値段',exact:true}).click();await expect(page.locator('.drink-options')).toContainText('65円');
 await page.getByRole('navigation').getByRole('button',{name:'やってみる',exact:true}).click();
 await page.getByRole('button',{name:/今月の電気代はいくら/}).click();await page.getByLabel('調べる前は、どう思う？').fill('先月より高いかも');
 await page.getByRole('button',{name:'何からやるか、一緒に考える'}).click();await page.getByRole('button',{name:'この順番でやってみる'}).click();await expect(page.locator('.cost-result')).toContainText('1,700');
});
test('公開後の共有撤回は新聞からも反映される',async({page})=>{
 await role(page,'親');await page.getByRole('navigation').getByRole('button',{name:'新聞を届ける',exact:true}).click();await page.getByRole('button',{name:'この記録で新聞を作ってみる'}).click();await page.getByRole('button',{name:'この内容で新聞を届ける'}).click();
 await role(page,'子ども');await page.getByRole('navigation').getByRole('button',{name:'発見帳',exact:true}).click();await page.getByRole('button',{name:/同じ量なら/}).click();
 await page.getByRole('button',{name:'祖父母への共有を取り消す'}).click();await role(page,'祖父母');await page.getByRole('navigation').getByRole('button',{name:'おたより',exact:true}).click();
 await expect(page.locator('.family-paper')).not.toContainText('同じ量なら');await expect(page.locator('.family-paper')).toContainText('おやつの予算');
});
test('歩数未取得・非共有でもワンタップ連絡できる',async({page})=>{
 await page.getByRole('button',{name:'表示とデモの設定'}).click();await page.getByLabel('歩数のデモ状態').selectOption('unavailable');
 await role(page,'祖父母');await page.getByLabel('この歩数を親に見せる').uncheck();await page.getByRole('button',{name:'元気だよ',exact:true}).click();
 await role(page,'親');await expect(page.locator('.welfare-card')).toContainText('元気だよ');await expect(page.locator('.welfare-card')).toContainText('歩数は共有していません');
});
test('初期画面・200%表示で横はみ出しがなく画像が読める',async({page})=>{
 await expect(page.locator('h1')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 expect(await page.locator('img').evaluateAll(imgs=>imgs.every(i=>(i as HTMLImageElement).complete&&(i as HTMLImageElement).naturalWidth>0))).toBe(true);
 await page.screenshot({path:'screenshots/automated/'+test.info().project.name+'-child.png',fullPage:true});
 await page.getByRole('button',{name:'表示とデモの設定'}).click();await page.getByLabel('文字を200%に').check();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
