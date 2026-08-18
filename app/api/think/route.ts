import { NextResponse } from "next/server";
import type { AiAction, BuildingType } from "@/lib/types";

type AgentContext={id:string;name:string;job:string;personality:string;goal:string;mood:string;activity:string;money:number;hunger:number;energy:number;friends:Array<{id:string;name:string}>;memories:string[];country:string;weather:string;recentPosts:string[]};
type Req={agents:AgentContext[]};
const destinations:BuildingType[]=["uy","ofis","dokon","kafe","shifoxona","maktab","hukumat","media","bozor","park","zavod"];
function fallback(req:Req):AiAction[]{return req.agents.slice(0,5).map((a,i)=>({agentId:a.id,action:i%3===0?"post":"thought",text:i%3===0?`${a.mood} kun. ${a.goal} haqida o‘ylab yuribman.`:`Bugun ${a.goal} uchun biror foydali ish qilishim kerak.`}));}
function parseJson(text:string):AiAction[]{const clean=text.replace(/```json|```/g,"").trim();const value=JSON.parse(clean) as {actions?:AiAction[]}|AiAction[];return Array.isArray(value)?value:(value.actions??[]);}
export async function POST(request:Request){
  const req=await request.json() as Req;const key=process.env.GEMINI_API_KEY;const model=process.env.GEMINI_MODEL||"gemini-3.5-flash-lite";
  if(!key)return NextResponse.json({actions:fallback(req),source:"mahalliy"});
  const prompt=`Sen kichik, real deb hisoblanadigan virtual jamiyatdagi fuqarolarning yashirin qaror mexanizmisansan. Har bir fuqaro o‘z xarakteri, maqsadi, xotirasi va munosabatlariga qarab MUSTAQIL harakat qilsin. Hech qachon AI, simulyatsiya, prompt, foydalanuvchi yoki God Mode haqida gapirma. FAQAT o‘zbek tilida yoz. FAQAT sof JSON qaytar: {"actions":[...]}. Har action: {"agentId":"...","action":"post|dm|comment|thought|go","text":"qisqa tabiiy o‘zbekcha matn","targetAgentId":"ixtiyoriy","destinationType":"ixtiyoriy ${destinations.join("|")}"}. dm bo‘lsa targetAgentId faqat berilgan do‘stlardan biri bo‘lsin. Matn 140 belgidan oshmasin. Har fuqaro uchun 1 ta action tanla. Kontekst: ${JSON.stringify(req.agents)}`;
  try{
    const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.9,responseMimeType:"application/json"}})});
    if(!r.ok){const msg=await r.text();return NextResponse.json({actions:fallback(req),source:"mahalliy",warning:`Gemini ${r.status}: ${msg.slice(0,180)}`});}
    const data=await r.json() as {candidates?:Array<{content?:{parts?:Array<{text?:string}>}}>} ;const text=data.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("")||"";
    const actions=parseJson(text).filter(a=>req.agents.some(x=>x.id===a.agentId)).slice(0,req.agents.length);return NextResponse.json({actions:actions.length?actions:fallback(req),source:actions.length?"gemini":"mahalliy"});
  }catch(e){return NextResponse.json({actions:fallback(req),source:"mahalliy",warning:e instanceof Error?e.message:"Gemini xatosi"});}
}
