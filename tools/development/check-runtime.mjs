import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const manifest = JSON.parse(await readFile(new URL('./package.json', import.meta.url), 'utf8'));
assert.equal(Number(process.versions.node.split('.')[0]), 24, 'Node 24 is required');
for (const name of ['react','react-dom','typescript','vite','jsdom','@playwright/test','@axe-core/playwright','@testing-library/react','@testing-library/user-event']) {
  const value = await import(name);
  assert.ok(value, name + ' failed to import');
}
for (const name of ['vitest','storybook','@storybook/react-vite','@storybook/addon-a11y']) {
  const pkg = JSON.parse(await readFile(new URL('./node_modules/' + name + '/package.json', import.meta.url), 'utf8'));
  assert.ok(pkg.version, name + ' metadata missing');
}
console.log(JSON.stringify({status:'passed',node:process.versions.node,packages:Object.keys(manifest.devDependencies)},null,2));
