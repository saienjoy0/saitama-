// Prepared for a browser-capable Codex environment. Not executed in the originating
// Work Mode session: browser policy blocked both localhost and file: navigation.
import { test, expect, type Page } from "@playwright/test";
async function role(page: Page, name: "子ども" | "親" | "祖父母") {
  await page.getByRole("button", { name: new RegExp("^" + name) }).click();
}
async function makeCard(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "この探検をはじめる" }).click();
  await page.getByRole("button", { name: /B：おおきい飲み物/ }).click();
  await page.getByRole("button", { name: "比べてみる", exact: true }).click();
  await page.getByRole("button", { name: "100mlあたり", exact: true }).click();
  await expect(page.locator(".metric").nth(0)).toHaveText("90円");
  await expect(page.locator(".metric").nth(1)).toHaveText("65円");
  await page.getByRole("button", { name: /飲み物 A/ }).click();
  await page.getByRole("button", { name: "選んだ理由へ" }).click();
  await page
    .getByRole("button", { name: "飲みきれる量を選びたい", exact: true })
    .click();
  await page.getByRole("button", { name: "発見カードをつくる" }).click();
  await expect(page.locator(".record")).toContainText("B：おおきい飲み物");
  await expect(page.locator(".record")).toContainText("A：ちいさい飲み物");
  await expect(page.locator(".record blockquote")).toHaveText(
    "「飲みきれる量を選びたい」",
  );
}
async function share(page: Page) {
  await makeCard(page);
  await page.getByRole("button", { name: "この内容を共有する" }).click();
  await role(page, "親");
}
async function approve(page: Page) {
  await share(page);
  await page.getByRole("button", { name: "この内容・宛先で承認する" }).click();
  await role(page, "祖父母");
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}
test("非共有は親にも祖父母にも非表示", async ({ page }) => {
  await makeCard(page);
  await page.getByRole("button", { name: "共有しないで次へ" }).click();
  await role(page, "親");
  await expect(page.getByText("今、確認することはありません。")).toBeVisible();
  await expect(page.locator(".record")).toHaveCount(0);
  await role(page, "祖父母");
  await expect(page.getByText("おたよりが届いたら、ここに。")).toBeVisible();
  await expect(page.locator(".newspaper")).toHaveCount(0);
});
test("保留のカードは祖父母に見せない", async ({ page }) => {
  await share(page);
  await expect(page.locator(".record blockquote")).toHaveText(
    "「飲みきれる量を選びたい」",
  );
  await page.getByRole("button", { name: "いったん保留する" }).click();
  await expect(page.getByRole("status")).toContainText("まだ表示されません");
  await role(page, "祖父母");
  await expect(page.locator(".newspaper")).toHaveCount(0);
});
test("承認→返信→子の選択→次の一歩・撤回・リセット", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("01-child-home.png"),
    fullPage: true,
  });
  await share(page);
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("02-parent-review.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "この内容・宛先で承認する" }).click();
  await role(page, "祖父母");
  await noOverflow(page);
  await expect(page.locator(".newspaper")).toContainText(
    "飲みきれる量を選びたい",
  );
  await page.screenshot({
    path: testInfo.outputPath("03-grandparent-letter.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "経験を伝える" }).click();
  await page.getByRole("button", { name: "この言葉を返す" }).click();
  await role(page, "子ども");
  await expect(page.locator(".family-reply")).toContainText(
    "おばあちゃんの経験",
  );
  await page.getByRole("button", { name: "この問いを確かめたい" }).click();
  await expect(page.locator(".next-result")).toContainText(
    "家にある空の飲み物容器を2つ",
  );
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("04-next-action.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "共有を取り消す" }).click();
  await expect(page.locator(".family-reply")).toHaveCount(0);
  await role(page, "祖父母");
  await expect(page.locator(".newspaper")).toHaveCount(0);
  await page.getByRole("button", { name: "最初から", exact: true }).click();
  await page.getByRole("button", { name: "リセットする" }).click();
  await expect(
    page.getByRole("button", { name: "この探検をはじめる" }),
  ).toBeVisible();
  await role(page, "親");
  await expect(page.locator(".record")).toHaveCount(0);
});
test("無返信でも子は次の問いを選べる", async ({ page }) => {
  await approve(page);
  await page.getByRole("button", { name: "今回は返信しない" }).click();
  await expect(page.getByText("今日は、読むだけ。")).toBeVisible();
  await role(page, "子ども");
  await page.getByRole("button", { name: "この問いを確かめたい" }).click();
  await expect(page.locator(".next-result")).toContainText("自分で選んだ問い");
});
test("模擬AIの表示・固定ヒント・中断再開", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "この探検をはじめる" }).click();
  await page
    .getByRole("button", { name: "まだ分からない", exact: true })
    .click();
  await page.getByRole("button", { name: "比べてみる", exact: true }).click();
  await page.getByRole("button", { name: "どう比べたらよい？" }).click();
  await expect(page.locator(".assist-panel")).toContainText(
    "模擬・API通信なし",
  );
  await page.getByRole("button", { name: "もっと小さく" }).click();
  await expect(page.locator(".assist-panel")).toContainText("まずAの");
  await page.screenshot({
    path: testInfo.outputPath("05-assistance.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "ヒントを見る", exact: true }).click();
  await expect(page.getByText("固定ヒント", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "やめる", exact: true }).click();
  await page.getByRole("button", { name: "探検を再開する" }).click();
  await expect(
    page.getByRole("button", { name: "選んだ理由へ" }),
  ).toBeDisabled();
});
test("200%文字・動き抑制・キーボード・ブラウザエラー", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "この探検をはじめる" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "まずは、直感で予想しよう。" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "表示設定" }).click();
  await page.getByLabel("文字を200%にする").check();
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("06-large-text.png"),
    fullPage: true,
  });
  expect(
    await page
      .locator(".workspace")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  expect(errors).toEqual([]);
});
test("ビルド済みオフラインHTMLがアセット追加読込なしで動く", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.goto("/presentation-offline.html");
  await page.getByRole("button", { name: "この探検をはじめる" }).click();
  await expect(
    page.getByRole("button", { name: "比べてみる", exact: true }),
  ).toBeVisible();
  expect(requests.filter((x) => !/presentation-offline.html/.test(x))).toEqual(
    [],
  );
});
