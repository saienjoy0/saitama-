import { test } from 'node:test';
import assert from 'node:assert/strict';
import { electricityCost } from '../src/quest-model.ts';
test('watts are converted to kW and time changes the practice estimate',()=>{
 assert.equal(electricityCost(10,5,31),1.55);
 assert.equal(electricityCost(10,1,31),0.31);
 assert.equal(electricityCost(60,5,31),9.3);
 assert.equal(electricityCost(10,0,31),0);
});
