import { NextRequest, NextResponse } from "next/server";
import { sessionToken } from "@/lib/auth";
export async function proxy(req:NextRequest){
  const p=req.nextUrl.pathname;
  if(p.startsWith("/_next")||p==="/login"||p==="/api/login"||p==="/favicon.ico") return NextResponse.next();
  const token=req.cookies.get("ai_earth_session")?.value;
  const expected=await sessionToken();
  if(token!==expected){const url=req.nextUrl.clone();url.pathname="/login";url.searchParams.set("next",p);return NextResponse.redirect(url);}
  return NextResponse.next();
}
export const config={matcher:["/((?!_next/static|_next/image).*)"]};
