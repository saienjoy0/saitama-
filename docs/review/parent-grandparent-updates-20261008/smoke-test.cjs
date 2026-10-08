// Run: node --test docs/review/parent-grandparent-updates-20261008/smoke-test.cjs
// Synthetic integration test with DOM mocks. Real browser, authentication and network are NOT tested.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const parentHtml=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const grandHtml=fs.readFileSync(path.join(__dirname,'../grandparent-fixed-ui-20261008/index.html'),'utf8');
const extract=html=>html.match(/<script>([\s\S]*?)<\/script>/)[1];
function harness(){
 const posted=[],jobs=[],listeners={};
 const pMain={innerHTML:'',scrollTop:0,addEventListener(t,fn){this[t]=fn}};
 const dlg={showModal(){this.open=true},close(){this.open=false}};
 const frameWin={};
 const frame={contentWindow:frameWin};
 const pFooter={addEventListener(t,fn){this[t]=fn}};
 const pClose={addEventListener(t,fn){this[t]=fn}};
 const pn=['today','history'].map(view=>({dataset:{view},setAttribute(){},removeAttribute(){}}));
 const pDoc={getElementById(id){return({main:pMain,grandDialog:dlg,grandFrame:frame,closeDemo:pClose})[id]},querySelector(){return pFooter},querySelectorAll(){return pn}};
 const pWindow={addEventListener(t,fn){listeners[t]=fn}};
 const pCtx=vm.createContext({document:pDoc,window:pWindow,Date,Intl,Math,Number,Set,String,console});
 vm.runInContext(extract(parentHtml),pCtx);
 const pApi=pWindow.YattemiParentDemo;
 const gMain={innerHTML:'',scrollTop:0,addEventListener(t,fn){this[t]=fn}};
 const gApp={classList:{toggle(){}}};
 const gSize={textContent:'A+',addEventListener(t,fn){this[t]=fn}};
 const gFoot={addEventListener(t,fn){this[t]=fn}};
 const gn=['news','album','today'].map(tab=>({dataset:{tab},setAttribute(){},removeAttribute(){}}));
 const gDoc={getElementById(id){return({main:gMain,app:gApp,large:gSize})[id]||{textContent:''}},querySelector(){return gFoot},querySelectorAll(){return gn},dispatchEvent(){}};
 const gWindow={location:{origin:'null'},parent:{postMessage(data,origin){posted.push({data,origin});listeners.message({source:frameWin,data})}}};
 const gCtx=vm.createContext({document:gDoc,window:gWindow,Intl,Date,Number,String,Math,Set,Map,console,
 setTimeout(fn){jobs.push(fn)},
 CustomEvent:class {constructor(type,init){this.type=type;this.detail=init.detail}}
 });
 vm.runInContext(extract(grandHtml),gCtx);
 const gApi=gWindow.YattemiGrandparentDemo;
 const press=(a)=>gMain.click({target:{closest(selector){return selector==='[data-action]'?{dataset:{action:a},disabled:false}:null}}});
 const input=(id,value)=>gMain.input({target:{id,value}});
 const flush=()=>{while(jobs.length)jobs.shift()()};
 return {pApi,gApi,pMain,gMain,posted,press,input,flush,listeners,frameWin};
}
test('grandparent manual steps require explicit share and ACK before parent sees them',()=>{
 const x=harness();
 assert.equal(x.pApi.getState().count,3);
 assert.equal(x.pApi.getState().todaySteps,null);
 x.press('tab:today');
 x.input('steps','5200');x.press('savesteps');
 assert.equal(x.pApi.getState().todaySteps,null);
 assert.match(x.gMain.innerHTML,/家族へ知らせる/);
 x.press('sendsteps');assert.equal(x.pApi.getState().todaySteps,null);
 x.flush();assert.equal(x.pApi.getState().todaySteps,5200);
 assert.equal(x.posted[0].data.detail.stepSource,'manual');
});
test('genki update only on success, failed steps do not replace previous report',()=>{
 const x=harness();x.press('tab:today');
 x.press('genki');assert.equal(x.pApi.getState().todayGenki,false);
 x.flush();assert.equal(x.pApi.getState().todayGenki,true);
 x.input('steps','5200');x.press('savesteps');x.press('sendsteps');x.flush();
 x.input('steps','3000');x.press('savesteps');
 x.gApi.setNextSendFailure();x.press('sendsteps');x.flush();
 assert.equal(x.pApi.getState().todaySteps,5200);
 assert.match(x.gMain.innerHTML,/まだ送れていません/);
 x.press('sendsteps');x.flush();assert.equal(x.pApi.getState().todaySteps,3000);
 x.pApi.switchView('history');assert.match(x.pMain.innerHTML,/5,200歩/);assert.match(x.pMain.innerHTML,/3,000歩/);
});
test('wrong source, duplicate ID, invalid step data and other family are rejected',()=>{
 const x=harness();
 const event={familyId:'family-demo',memberId:'grandma',kind:'steps',clientEventId:'test-999',source:'grandparent-demo',sentAt:new Date().toISOString(),steps:0,stepSource:'manual'};
 assert.equal(x.pApi.receive(event),true);
 assert.equal(x.pApi.getState().todaySteps,0);
 assert.equal(x.pApi.receive(event),false);
 assert.equal(x.pApi.receive({...event,clientEventId:'bad1',steps:-1}),false);
 assert.equal(x.pApi.receive({...event,clientEventId:'bad2',familyId:'family-other'}),false);
 assert.equal(x.pApi.receive({...event,clientEventId:'bad3',memberId:'stranger'}),false);
 const count=x.pApi.getState().count;
 x.listeners.message({source:{},data:{type:'yattemi:grandparent-demo-event',detail:{...event,clientEventId:'spoof'}}});
 assert.equal(x.pApi.getState().count,count);
});
test('parent-only scope: child approval remains unimplemented',()=>{
 const x=harness();
 assert.match(x.pMain.innerHTML,/次の設計で決めます/);
 assert.doesNotMatch(x.pMain.innerHTML,/data-act="approve:/);
 assert.match(parentHtml,/height:100dvh/);
 assert.match(grandHtml,/今日も元気だよ/);
});
