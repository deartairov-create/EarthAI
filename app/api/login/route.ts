import { NextResponse } from "next/server";
import { sessionToken } from "@/lib/auth";
export async function POST(req:Request){
  const body=await req.json().catch(()=>({})) as {password?:string};
  const wanted=process.env.APP_PASSWORD||"earthai";
  if(body.password!==wanted) return NextResponse.json({ok:false,error:"Wrong password"},{status:401});
  const res=NextResponse.json({ok:true});
  res.cookies.set("ai_earth_session",await sessionToken(),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*30});
  return res;
}
