// Run: node --test docs/review/grandparent-fixed-ui-20261008/smoke-test.cjs
// Isolated DOM-stub test; does NOT replace real Chromium, mobile or authorization testing.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function setup(){
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const events=[];
  const main={innerHTML:'',scrollTop:0,style:{},handlers:{},addEventListener(type,handler){this.handlers[type]=handler}};
  let large=false;
  const app={classList:{toggle(name,value){if(name==='large')large=value}}};
  const font={textContent:'A+',addEventListener(type,handler){this.press=handler}};
  const footer={addEventListener(type,handler){this.press=handler}};
  const tabs=['news','album','today'].map(tab=>({dataset:{tab},setAttribute(){},removeAttribute(){}}));
  const document={
    getElementById(id){return {app,main,large:font}[id]||{textContent:''}},
    querySelector(){return footer},
    querySelectorAll(){return tabs},
    dispatchEvent(event){events.push(event.detail)}
  };
  const jobs=[];
  const context=vm.createContext({document,window:{},setTimeout(fn){jobs.push(fn)},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},Date,Number,String,Array,Map,Set,console});
  vm.runInContext(script,context);
  const api=context.window.YattemiGrandparentDemo;
  function action(name){main.handlers.click({target:{closest(sel){return sel==='[data-action]'?{dataset:{action:name},disabled:false}:null}}})}
  function kind(name){main.handlers.click({target:{closest(sel){return sel==='[data-kind]'?{dataset:{kind:name}}:null}}})}
  function input(id,value){main.handlers.input({target:{id,value}})}
  function settle(){while(jobs.length)jobs.shift()()}
  return {html,main,api,font,events,action,kind,input,settle,get large(){return large}};
}
test('three fixed tabs, reasons, question, acknowledgement and retry',()=>{
  const x=setup();
  assert.equal(x.api.getState().tab,'news');
  assert.match(x.main.innerHTML,/家族の新聞/);
  x.action('open:curry');
  assert.equal(x.api.getState().page,'detail');
  assert.match(x.main.innerHTML,/B店の方が安かった/);
  x.action('reply');
  assert.match(x.main.innerHTML,/今度はどんな料理を作ってみたい/);
  x.kind('experience');assert.match(x.main.innerHTML,/冷凍/);
  x.kind('question');
  x.api.setNextSendFailure();x.action('send');assert.equal(x.events.length,0);
  x.settle();assert.match(x.main.innerHTML,/まだ送れていません/);
  x.action('send');x.settle();
  assert.equal(x.api.getState().page,'complete');
  assert.equal(x.events[0].replyType,'question');
  x.action('back');x.action('read');x.settle();
  assert.equal(x.api.getState().readCount,1);
  x.action('read');x.settle();
  assert.equal(x.api.getState().readCount,1);
});
test('album, hand-entered steps, independent genki and revocation',()=>{
 const x=setup();
 x.action('tab:album');assert.match(x.main.innerHTML,/photoTile/);
 x.action('photo:0');assert.equal(x.api.getState().page,'photo');
 x.action('next');assert.match(x.main.innerHTML,/2 \/ 2/);
 x.action('tab:today');assert.equal(x.api.getState().tab,'today');
 x.input('steps','-7');x.action('savesteps');assert.match(x.main.innerHTML,/整数で入力/);
 assert.equal(x.api.getState().steps,null);
 x.input('steps','5200');x.action('savesteps');assert.equal(x.api.getState().steps,5200);
 x.action('genki');assert.equal(x.events.length,0);x.settle();
 assert.equal(x.api.getState().genki,true);
 x.font.press();assert.equal(x.large,true);
 x.api.revoke('curry');x.action('tab:news');assert.doesNotMatch(x.main.innerHTML,/おばあちゃんとカレーを食べたよ/);
 x.api.replacePublished([{id:'allow',version:1,published:true,title:'許可済み記事',author:'はるちゃん',date:'10月8日',intro:'体験',choice:'選んだ',reason:'',photos:[]}]);
 assert.match(x.main.innerHTML,/許可済み記事/);
});
