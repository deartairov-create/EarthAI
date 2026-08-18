"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
export default function Login(){
  const [password,setPassword]=useState("");const [error,setError]=useState("");const [busy,setBusy]=useState(false);const router=useRouter();
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError("");const r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});if(r.ok){router.replace("/");router.refresh();}else{const data=await r.json().catch(()=>({error:"Parol noto‘g‘ri"})) as {error?:string};setError(data.error||"Parol noto‘g‘ri");setBusy(false);}}
  return <main className="loginPage"><form className="loginCard" onSubmit={submit}><div className="planetMark">◎</div><div className="eyebrow">YOPIQ SHAXSIY DUNYO</div><h1>AI Yer — Haqiqiy 3D</h1><p>Bu dunyoga faqat siz kira olasiz.</p><input autoFocus type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Parol"/><button disabled={busy}>{busy?"Ochilyapti…":"Dunyoga kirish"}</button>{error&&<div className="error">{error}</div>}<small>Vercel’da APP_PASSWORD ni albatta o‘zgartiring.</small></form></main>;
}
