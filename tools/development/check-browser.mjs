import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route('**/*', route => route.fulfill({contentType:'text/html', body:'<!doctype html><html lang="ja"><head><title>環境確認</title></head><body><main><h1>環境確認</h1><button type="button">確認</button></main></body></html>'}));
  await page.goto('http://environment-check.invalid');
  await page.getByRole('button', { name: '確認', exact: true }).click();
  await page.keyboard.press('Tab');
  const result = await new AxeBuilder({ page }).analyze();
  assert.equal(result.violations.length, 0, JSON.stringify(result.violations));
  console.log('PASS: Chromium launch, Japanese page, role query/click, keyboard, axe. Environment smoke only; no product UI verified.');
} finally { await browser.close(); }
