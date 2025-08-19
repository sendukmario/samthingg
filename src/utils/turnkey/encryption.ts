// 🔐 DO NOT EDIT — AUTO-OBFUSCATED CRYPTO
export async function encryptData(d: string, p: string) {
  const e = new TextEncoder(),
    s = crypto.getRandomValues(new Uint8Array(16)),
    v = crypto.getRandomValues(new Uint8Array(12));
  const k = await crypto.subtle.importKey("raw", e.encode(p), "PBKDF2", !1, [
    "deriveKey",
  ]);
  const a = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: s, iterations: 1e5, hash: "SHA-256" },
    k,
    { name: "AES-GCM", length: 256 },
    !1,
    ["encrypt"],
  );
  const c = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: v },
    a,
    e.encode(d),
  );
  const r = new Uint8Array(s.length + v.length + c.byteLength);
  return (
    r.set(s),
    r.set(v, s.length),
    r.set(new Uint8Array(c), s.length + v.length),
    btoa(String.fromCharCode(...r))
  );
}

export async function decryptData(e: string, p: string) {
  const d = Uint8Array.from(atob(e), (c) => c.charCodeAt(0));
  const [s, v, c] = [d.slice(0, 16), d.slice(16, 28), d.slice(28)];
  const f = new TextEncoder();
  const k = await crypto.subtle.importKey("raw", f.encode(p), "PBKDF2", !1, [
    "deriveKey",
  ]);
  const a = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: s, iterations: 1e5, hash: "SHA-256" },
    k,
    { name: "AES-GCM", length: 256 },
    !1,
    ["decrypt"],
  );
  const x = await crypto.subtle.decrypt({ name: "AES-GCM", iv: v }, a, c);
  return new TextDecoder().decode(x);
}
