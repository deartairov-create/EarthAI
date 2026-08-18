function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function sessionToken() {
  const production = process.env.NODE_ENV === "production";
  const password = process.env.APP_PASSWORD || (production ? "__APP_PASSWORD_SOZLANMAGAN__" : "earthai");
  const secret = process.env.SESSION_SECRET || (production ? "__SESSION_SECRET_SOZLANMAGAN__" : "faqat-local-uchun-almashtiring");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(password)));
}
