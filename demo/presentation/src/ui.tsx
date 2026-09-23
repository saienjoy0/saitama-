import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Camera, ImagePlus, X, ArrowRight } from 'lucide-react';
import sample from './assets/discovery.jpg?inline';
import electricity from './assets/electricity.jpg?inline';
import type { Photo } from './family';
export const now=()=>new Date().toISOString();
export const dateText=(v:string)=>new Date(v).toLocaleDateString('ja-JP',{timeZone:'Asia/Tokyo',month:'long',day:'numeric'});
export const timeText=(v:string|null)=>v?new Date(v).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'まだ届いていません';
export const photoSrc=(photo:NonNullable<Photo>)=>photo.src==='sample'?sample:photo.src==='electricity'?electricity:photo.src;
export function Button({children,onClick,secondary=false,disabled=false}:{children:ReactNode;onClick:()=>void;secondary?:boolean;disabled?:boolean}){
 return <button className={'btn '+(secondary?'btn-secondary':'btn-primary')} disabled={disabled} onClick={onClick}>{children}</button>;
}
export function Tag({children,tone=''}:{children:ReactNode;tone?:string}){return <span className={'tag '+tone}>{children}</span>;}
export function Heading({kicker,title,sub,action}:{kicker:string;title:string;sub?:string;action?:ReactNode}){return <header className="page-heading"><div><p className="eyebrow">{kicker}</p><h1>{title}</h1>{sub&&<p>{sub}</p>}</div>{action}</header>;}
export function Empty({title,children}:{title:string;children?:ReactNode}){return <div className="empty-state"><h2>{title}</h2>{children}</div>;}
export function PhotoPicker({value,onChange,sampleEnabled=true}:{value:Photo;onChange:(p:Photo)=>void;sampleEnabled?:boolean}){
 const id=useId(); const [error,setError]=useState('');const [busy,setBusy]=useState(false);const sequence=useRef(0);
 useEffect(()=>()=>{sequence.current++},[]);
 const read=(file?:File)=>{
  if(!file)return; const token=++sequence.current;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){setBusy(false);setError('JPEG・PNG・WebPの写真を選んでね（10MBまで）。書いたことは残っているよ。');return;}
  setError('');setBusy(true);const reader=new FileReader();
  reader.onerror=()=>{if(token===sequence.current){setError('写真を読みこめませんでした。写真なしでも進めるよ。');setBusy(false)}};
  reader.onload=()=>{const img=new Image();img.onload=()=>{if(token===sequence.current){onChange({src:String(reader.result),alt:'自分で選んだ発見の写真'});setBusy(false)}};img.onerror=()=>{if(token===sequence.current){setError('写真を開けませんでした。別の写真を選んでね。');setBusy(false)}};img.src=String(reader.result)};reader.readAsDataURL(file);
 };
 return <div className="photo-picker"><div className="section-title"><h3>写真も残す？</h3><Tag>つけなくてもOK</Tag></div>
 {value&&<div className="photo-preview"><img src={photoSrc(value)} alt={value.alt}/><button aria-label="写真を外す" onClick={()=>{sequence.current++;setBusy(false);onChange(null)}}><X size={20}/></button></div>}
 <div className="photo-actions"><label className="btn btn-secondary" htmlFor={id+'camera'}><Camera size={18}/>撮る<input id={id+'camera'} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e=>{read(e.target.files?.[0]);e.target.value=''}}/></label>
 <label className="btn btn-secondary" htmlFor={id+'file'}><ImagePlus size={18}/>写真を選ぶ<input id={id+'file'} type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{read(e.target.files?.[0]);e.target.value=''}}/></label>
 {sampleEnabled&&<><button className="text-btn" onClick={()=>{sequence.current++;setBusy(false);setError('');onChange({src:'electricity',alt:'机の明かりを調べるデモ写真（生成素材）'})}}>電気のデモ写真</button><button className="text-btn" onClick={()=>{sequence.current++;setBusy(false);setError('');onChange({src:'sample',alt:'飲み物のデモ写真（生成素材）'})}}>飲み物のデモ写真</button></>}</div>
 {busy&&<p role="status">写真を読みこみ中…</p>}{error&&<p className="error" role="alert">{error}</p>}<small>写真はこの画面の中だけ。外には送りません。</small></div>;
}
export function NextButton({onClick,children}:{onClick:()=>void;children:ReactNode}){return <Button onClick={onClick}>{children}<ArrowRight size={18}/></Button>;}
