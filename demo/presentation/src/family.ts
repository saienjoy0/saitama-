export type Photo = { src: string; alt: string } | null;
export type Discovery = {
  id: string; revision: number; title: string; reason: string; date: string; photo: Photo;
  prediction?: string; choice?: string;
  points: 'private' | 'pending' | 'held' | 'approved';
  share: 'private' | 'pending' | 'held' | 'approved'; approvedRevision: number | null;
};
export type Reward = {title:string;cost:number;kind:'once'|'monthly'|'experience';terms:string;status:'pending'|'held'|'approved'};
export type Issue = { id: string; title: string; at: string; audience: 'おばあちゃん'; materials: { id: string; revision: number }[] };
export type Family = {
 records: Discovery[]; ledger: {id:string; label:string; amount:number; at:string}[];
 reward:Reward; exchange: 'none'|'pending'|'held'|'planned'|'given'|'received'; exchangeNumber: number;
 issues: Issue[]; steps: {count:number|null; date:string; updatedAt:string|null; source:string; shared:boolean};
 checkin: {at:string; text:string; photo:Photo}|null;
 replies: {issueId:string; text:string; at:string}[]; next: {title:string; source:string}|null;
};
export const DEMO_DAY='2026-09-23';
export function createFamily():Family {
 return {records:[
 {id:'past-1',revision:1,title:'同じ量なら、どっちがお得？',reason:'大きいほうは100mlで65円。小さいほうは90円。量をそろえると比べやすかった。',date:'2026-09-20T15:00:00+09:00',photo:{src:'sample',alt:'大小の飲み物を比べる、架空の発見写真'},points:'approved',share:'approved',approvedRevision:1},
 {id:'past-2',revision:1,title:'おやつの予算を決めてみた',reason:'全部使わずに、100円残しておいた。次に買いたいものもあるから。',date:'2026-09-21T16:00:00+09:00',photo:null,points:'approved',share:'approved',approvedRevision:1}],
 ledger:[{id:'opening',label:'これまでにためたポイント（開始残高）',amount:45,at:'2026-09-22T18:00:00+09:00'}],
 reward:{title:'今月のおこづかい500円',cost:50,kind:'once',terms:'今月1回。交換したら、おうちの人から受け取る。',status:'approved'},
 exchange:'none',exchangeNumber:0,issues:[],steps:{count:3240,date:DEMO_DAY,updatedAt:'2026-09-23T09:40:00+09:00',source:'デモデータ',shared:true},checkin:null,replies:[],next:null};
}
export type FamilyAction =
 | {type:'record';id:string;title:string;reason:string;photo:Photo;date:string;apply:boolean;share:boolean;prediction?:string;choice?:string}
 | {type:'points'|'sharing';id:string;approve:boolean}
 | {type:'apply';id:string;share:boolean} | {type:'revoke';id:string}
 | {type:'publish';ids:string[];title:string;at:string}
 | {type:'proposeReward';title:string;cost:number;kind:Reward['kind'];terms:string}
 | {type:'reviewReward';approve:boolean}
 | {type:'exchange';op:'request'|'cancel'|'hold'|'approve'|'give'|'receive';at:string}
 | {type:'checkin';at:string} | {type:'statusDetail';text:string;photo:Photo} | {type:'revokeStatus'}
 | {type:'steps';mode:'today'|'zero'|'unavailable'|'yesterday'} | {type:'stepShare';value:boolean}
 | {type:'reply';issueId:string;text:string;at:string} | {type:'next';title:string;source:string} | {type:'reset'};
export const balance=(s:Family)=>s.ledger.reduce((n,l)=>n+l.amount,0);
export const available=(s:Family)=>balance(s)-(['pending','held'].includes(s.exchange)?s.reward.cost:0);
export const canPublish=(r:Discovery)=>r.share==='approved' && r.approvedRevision===r.revision;
export const issueRecords=(s:Family,i:Issue)=>i.materials.flatMap(m=>{const r=s.records.find(r=>r.id===m.id && r.revision===m.revision && canPublish(r));return r?[r]:[];});
export function familyReducer(s:Family,a:FamilyAction):Family {
 switch(a.type){
 case 'record':
   if(!a.title.trim()||!a.reason.trim()||s.records.some(r=>r.id===a.id))return s;
   return {...s,records:[...s.records,{id:a.id,revision:1,title:a.title.trim(),reason:a.reason.trim(),photo:a.photo,date:a.date,prediction:a.prediction,choice:a.choice,points:a.apply?'pending':'private',share:a.apply&&a.share?'pending':'private',approvedRevision:null}]};
 case 'apply': return {...s,records:s.records.map(r=>r.id===a.id&&r.points==='private'?{...r,points:'pending',share:a.share?'pending':'private'}:r)};
 case 'points': {
  const r=s.records.find(r=>r.id===a.id); if(!r||!['pending','held'].includes(r.points))return s;
  return {...s,records:s.records.map(r=>r.id===a.id?{...r,points:a.approve?'approved':'held'}:r),ledger:a.approve&&!s.ledger.some(l=>l.id===a.id)?[...s.ledger,{id:a.id,label:r.title,amount:5,at:r.date}]:s.ledger}; }
 case 'sharing': return {...s,records:s.records.map(r=>r.id===a.id&&r.share!=='private'?{...r,share:a.approve?'approved':'held',approvedRevision:a.approve?r.revision:null}:r)};
 case 'revoke':return {...s,records:s.records.map(r=>r.id===a.id?{...r,share:'private',approvedRevision:null}:r)};
 case 'publish': {
  const ids=[...new Set(a.ids)];const selected=ids.map(id=>s.records.find(r=>r.id===id));
  if(!ids.length||!a.title.trim()||selected.some(r=>!r||!canPublish(r)))return s;
  const materials=selected.map(r=>({id:r!.id,revision:r!.revision}));
  if(s.issues.some(i=>i.title===a.title.trim()&&JSON.stringify(i.materials)===JSON.stringify(materials)))return s;
  return {...s,issues:[...s.issues,{id:'issue-'+(s.issues.length+1),title:a.title.trim(),at:a.at,audience:'おばあちゃん',materials}]}; }
 case 'proposeReward':
  if(s.exchange!=='none'||!a.title.trim()||!a.terms.trim()||!Number.isInteger(a.cost)||a.cost<1||a.cost>10000)return s;
  return {...s,reward:{title:a.title.trim(),cost:a.cost,kind:a.kind,terms:a.terms.trim(),status:'pending'}};
 case 'reviewReward':return s.exchange==='none'?{...s,reward:{...s.reward,status:a.approve?'approved':'held'}}:s;
 case 'exchange':
  if(a.op==='request'&&s.exchange==='none'&&s.reward.status==='approved'&&available(s)>=s.reward.cost)return {...s,exchange:'pending',exchangeNumber:s.exchangeNumber+1};
  if(a.op==='cancel'&&['pending','held'].includes(s.exchange))return {...s,exchange:'none'};
  if(a.op==='hold'&&s.exchange==='pending')return {...s,exchange:'held'};
  if(a.op==='approve'&&['pending','held'].includes(s.exchange))return {...s,exchange:'planned',ledger:[...s.ledger,{id:'exchange-'+s.exchangeNumber,label:'ごほうびへ交換：'+s.reward.title,amount:-s.reward.cost,at:a.at}]};
  if(a.op==='give'&&s.exchange==='planned')return {...s,exchange:'given'};
  if(a.op==='receive'&&s.exchange==='given')return {...s,exchange:'received'};
  return s;
 case 'checkin':return {...s,checkin:{at:a.at,text:s.checkin?.text??'',photo:s.checkin?.photo??null}};
 case 'statusDetail':return s.checkin?{...s,checkin:{...s.checkin,text:a.text.trim(),photo:a.photo}}:s;
 case 'revokeStatus':return {...s,checkin:null};
 case 'steps':return {...s,steps:{...s.steps,count:a.mode==='unavailable'?null:a.mode==='zero'?0:3240,date:a.mode==='yesterday'?'2026-09-22':DEMO_DAY,updatedAt:a.mode==='unavailable'?null:a.mode==='yesterday'?'2026-09-22T18:00:00+09:00':'2026-09-23T09:40:00+09:00'}};
 case 'stepShare':return {...s,steps:{...s.steps,shared:a.value}};
 case 'reply':{
  const i=s.issues.find(i=>i.id===a.issueId);if(!i||!issueRecords(s,i).length||!a.text.trim())return s;
  return {...s,replies:[...s.replies.filter(r=>r.issueId!==a.issueId),{issueId:a.issueId,text:a.text.trim(),at:a.at}]};}
 case 'next':return {...s,next:{title:a.title,source:a.source}};
 case 'reset':return createFamily();
 }
}
