import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFamily, familyReducer as reduce, balance, available, issueRecords } from '../src/family.ts';
const at = '2026-09-23T10:15:00+09:00';
const record = (s = createFamily(), share = true) => reduce(s, { type:'record', id:'today', title:'飲みきれる量を選んだ', reason:'量も大事だから', photo:null, date:at, apply:true, share });
test('photo-free discovery earns points exactly once, without sharing',()=>{
 let s=record(createFamily(),false); assert.equal(s.records.length,3); assert.equal(balance(s),45);
 s=reduce(s,{type:'points',id:'today',approve:true}); s=reduce(s,{type:'points',id:'today',approve:true});
 assert.equal(balance(s),50); assert.equal(s.records[2].photo,null);
 s=reduce(s,{type:'publish',ids:['today'],title:'発見だより',at}); assert.equal(s.issues.length,0);
});
test('private records never enter parent review, holding does not credit',()=>{
 let s=reduce(createFamily(),{type:'record',id:'private',title:'自分の発見',reason:'秘密',photo:null,date:at,apply:false,share:true});
 s=reduce(s,{type:'points',id:'private',approve:true}); assert.equal(balance(s),45); assert.equal(s.records[2].share,'private');
 s=record(s); s=reduce(s,{type:'points',id:'today',approve:false}); assert.equal(balance(s),45);
});
test('point approval is separate from publication, revoking removes material but keeps points',()=>{
 let s=record(); s=reduce(s,{type:'points',id:'today',approve:true});
 s=reduce(s,{type:'publish',ids:['today'],title:'今週',at}); assert.equal(s.issues.length,0);
 s=reduce(s,{type:'sharing',id:'today',approve:true});
 s=reduce(s,{type:'publish',ids:['today'],title:'今週',at}); assert.equal(issueRecords(s,s.issues[0]).length,1);
 s=reduce(s,{type:'revoke',id:'today'}); assert.equal(issueRecords(s,s.issues[0]).length,0); assert.equal(balance(s),50);
});
test('exchange reserves once, cancel releases, approval spends once, receipt follows delivery',()=>{
 let s=record(); s=reduce(s,{type:'points',id:'today',approve:true});
 s=reduce(s,{type:'exchange',op:'request',at}); assert.equal(balance(s),50); assert.equal(available(s),0);
 s=reduce(s,{type:'exchange',op:'request',at}); assert.equal(available(s),0);
 s=reduce(s,{type:'exchange',op:'cancel',at}); assert.equal(available(s),50);
 s=reduce(s,{type:'exchange',op:'request',at}); s=reduce(s,{type:'exchange',op:'approve',at}); s=reduce(s,{type:'exchange',op:'approve',at});
 assert.equal(balance(s),0); assert.equal(s.exchange,'planned');
 s=reduce(s,{type:'exchange',op:'receive',at}); assert.equal(s.exchange,'planned');
 s=reduce(s,{type:'exchange',op:'give',at}); s=reduce(s,{type:'exchange',op:'receive',at}); assert.equal(s.exchange,'received');
});
test('welfare check works without steps and does not rewrite step timestamp',()=>{
 let s=createFamily(); s=reduce(s,{type:'steps',mode:'unavailable'}); const old=s.steps.updatedAt;
 s=reduce(s,{type:'checkin',at}); assert.equal(s.checkin?.at,at); assert.equal(s.steps.count,null); assert.equal(s.steps.updatedAt,old);
 s=reduce(s,{type:'steps',mode:'zero'}); assert.equal(s.steps.count,0); assert.equal(s.checkin?.at,at);
 s=reduce(s,{type:'stepShare',value:false}); assert.equal(s.steps.shared,false); assert.equal(s.checkin?.at,at);
});
test('repeated record and issue events are idempotent, reset removes session data',()=>{
 let s=record(); s=record(s); assert.equal(s.records.length,3);
 s=reduce(s,{type:'publish',ids:['past-1','past-2'],title:'今週',at}); s=reduce(s,{type:'publish',ids:['past-1','past-2'],title:'今週',at}); assert.equal(s.issues.length,1);
 s=reduce(s,{type:'reset'}); assert.equal(s.records.length,2); assert.equal(s.checkin,null); assert.equal(s.issues.length,0); assert.equal(balance(s),45);
});
test('child-proposed recurring reward needs parental approval and is redeemed only once',()=>{
 let s=record(); s=reduce(s,{type:'points',id:'today',approve:true});
 s=reduce(s,{type:'proposeReward',title:'毎月108円アップ',cost:50,kind:'monthly',terms:'10月からずっと。見直すときは親子で相談'});
 s=reduce(s,{type:'exchange',op:'request',at}); assert.equal(s.exchange,'none');
 s=reduce(s,{type:'reviewReward',approve:true}); s=reduce(s,{type:'exchange',op:'request',at});
 assert.equal(available(s),0); s=reduce(s,{type:'exchange',op:'approve',at}); assert.equal(balance(s),0);
 s=reduce(s,{type:'exchange',op:'approve',at}); assert.equal(balance(s),0); assert.equal(s.reward.kind,'monthly');
});
