function hex(bytes: ArrayBuffer) { return Array.from(new Uint8Array(bytes)).map(b=>b.toString(16).padStart(2,"0")).join(""); }
export async function sessionToken() {
  const password=process.env.APP_PASSWORD || "earthai";
  const secret=process.env.SESSION_SECRET || "dev-only-secret-change-me";
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return hex(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(password)));
}
