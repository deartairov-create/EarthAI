import { NextResponse } from "next/server";
export async function POST() { const r = NextResponse.json({ ok: true }); r.cookies.set("ai_earth_session", "", { path: "/", maxAge: 0 }); return r; }
