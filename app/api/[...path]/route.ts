import type { NextRequest } from "next/server";
import { isIP } from "node:net";
const MAX_BODY = 12 * 1024 * 1024;
async function proxy(request: NextRequest) {
  const origin = process.env.DJANGO_API_URL;
  if (!origin) return Response.json({ detail: "Autentifikatsiya serveri hali ulanmagan." }, { status: 503 });
  const url = new URL(request.url);
  const upstream = new URL(url.pathname + url.search, origin);
  if (upstream.origin !== new URL(origin).origin || !["/api/", "/media/"].some((prefix) => url.pathname.startsWith(prefix))) {
    return Response.json({ detail: "Invalid path" }, { status: 400 });
  }
  const headers = new Headers();
  for (const name of ["content-type", "cookie", "x-csrftoken", "origin", "referer", "accept-language"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const token = process.env.INTERNAL_PROXY_TOKEN;
  if (token) headers.set("x-vitrix-proxy-token", token);
  // Enable only for an edge header which your ingress OVERWRITES, never appends.
  const ipHeader = process.env.TRUSTED_CLIENT_IP_HEADER;
  const address = ipHeader ? request.headers.get(ipHeader)?.trim() : undefined;
  if (address && isIP(address)) headers.set("x-vitrix-client-ip", address);
  const site = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (site) headers.set("x-forwarded-proto", new URL(site).protocol === "https:" ? "https" : "http");
  try {
    let body: Uint8Array | undefined;
    if (!["GET", "HEAD"].includes(request.method)) {
      if (Number(request.headers.get("content-length")) > MAX_BODY) return Response.json({ detail: "So‘rov hajmi juda katta." }, { status: 413 });
      const reader = request.body?.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      if (reader) {
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          length += part.value.byteLength;
          if (length > MAX_BODY) {
            await reader.cancel();
            return Response.json({ detail: "So‘rov hajmi juda katta." }, { status: 413 });
          }
          chunks.push(part.value);
        }
      }
      body = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
    }
    const response = await fetch(upstream, {
      method: request.method, headers,
      body: body as BodyInit | undefined,
      redirect: "manual", signal: AbortSignal.timeout(20000), cache: "no-store",
    });
    const result = new Headers();
    for (const name of ["content-type", "retry-after", "content-language", "x-content-type-options"]) {
      const value = response.headers.get(name);
      if (value) result.set(name, value);
    }
    for (const cookie of response.headers.getSetCookie()) result.append("set-cookie", cookie);
    result.set("Cache-Control", "no-store");
    result.set("X-Content-Type-Options", "nosniff");
    return new Response(response.body, { status: response.status, headers: result });
  } catch {
    return Response.json({ detail: "Autentifikatsiya serveriga ulanib bo‘lmadi. Qayta urinib ko‘ring." }, { status: 503 });
  }
}
export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
