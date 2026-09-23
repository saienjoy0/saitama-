// Static checks only: no layout, event interaction or accessibility pass claim.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'docs/review/index.html'), 'utf8');
const features = JSON.parse(fs.readFileSync(path.join(root, 'docs/design/FEATURES.json'), 'utf8')).features;
const embedded = html.match(/<script id="featureData" type="application\/json">([\s\S]*?)<\/script>/)[1];
assert.deepEqual(JSON.parse(embedded), features);
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 1);
new vm.Script(scripts[0][1]);
assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(scripts[0][1]));
assert.ok(!/<(?:script|link|img)[^>]+(?:src|href)=["']https?:/i.test(html));
for (const id of ['childScreen','parentScreen','grandScreen','scenario','reduced','motionCard','featureList']) {
  assert.equal([...html.matchAll(new RegExp(`id="${id}"`, 'g'))].length, 1);
}
assert.ok(html.includes('prefers-reduced-motion:reduce'));
assert.ok(html.includes('body.reduce *'));
assert.ok(html.includes('実際には送信していません'));
console.log('PASS: inline JavaScript syntax, 21 embedded feature records, fixed IDs, no network calls/external assets, reduced-motion rules present.');
console.log('NOT RUN: browser interaction, rendered layout, assistive technology or product tests.');
