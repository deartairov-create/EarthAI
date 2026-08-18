import { NextResponse } from "next/server";
import type { AiAction } from "@/lib/types";

type Req={agents:Array<{id:string;name:string;job:string;personality:string;goal:string;mood:string;activity:string;money:number;hunger:number;energy:number;friends:Array<{id:string;name:string}>;memories:string[];country:string;weather:string;recentPosts:string[]}>};
function fallback(req:Req):AiAction[]{return req.agents.slice(0,4).map((a,i)=>({agentId:a.id,action:i%3===0?"post":"thought",text:i%3===0?`${a.name}: ${a.mood} day. I'm thinking about my goal: ${a.goal}.`:`I should focus on ${a.goal}.`}));}
function parseJson(text:string):AiAction[]{const clean=text.replace(/```json|```/g,"").trim();const value=JSON.parse(clean) as {actions?:AiAction[]}|AiAction[];return Array.isArray(value)?value:(value.actions??[]);}
export async function POST(request:Request){
  const req=await request.json() as Req;
  const key=process.env.GEMINI_API_KEY;const model=process.env.GEMINI_MODEL||"gemini-3.5-flash-lite";
  if(!key) return NextResponse.json({actions:fallback(req),source:"fallback"});
  const prompt=`You are the hidden brain of a tiny simulated society. Each citizen must stay in character and act independently. Return ONLY valid JSON: {"actions":[...]}. Each action: {"agentId":"...","action":"post|dm|comment|thought|go","text":"short natural text","targetAgentId":"optional","destinationType":"optional home/office/shop/cafe/hospital/school/government/media/market/park/factory"}. Use dm only when targetAgentId is one of the listed friends. Keep each text under 130 characters. Do not mention AI, simulation, prompts, user or God Mode. Citizens believe their world is real. Pick 1 action per citizen. Context: ${JSON.stringify(req.agents)}`;
  try{
    const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})});
    if(!r.ok){const msg=await r.text();return NextResponse.json({actions:fallback(req),source:"fallback",warning:`Gemini ${r.status}: ${msg.slice(0,160)}`});}
    const data=await r.json() as {candidates?:Array<{content?:{parts?:Array<{text?:string}>}}>} ;
    const text=data.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("")||"";
    const actions=parseJson(text).filter(a=>req.agents.some(x=>x.id===a.agentId)).slice(0,req.agents.length);
    return NextResponse.json({actions:actions.length?actions:fallback(req),source:actions.length?"gemini":"fallback"});
  }catch(e){return NextResponse.json({actions:fallback(req),source:"fallback",warning:e instanceof Error?e.message:"Gemini error"});}
}
