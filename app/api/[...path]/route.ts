import type { NextRequest } from "next/server";
async function proxy(request: NextRequest) {
  const origin = process.env.DJANGO_API_URL;
  if (!origin)
    return Response.json(
      {
        detail:
          "Autentifikatsiya serveri hali ulanmagan. DJANGO_API_URL sozlanishi kerak.",
      },
      { status: 503 },
    );
  const url = new URL(request.url);
  const upstream = new URL(url.pathname + url.search, origin);
  const headers = new Headers();
  for (const name of [
    "content-type",
    "cookie",
    "x-csrftoken",
    "origin",
    "accept-language",
  ]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // X-Forwarded-For is trusted only when ingress overwrites it. Disabled by default.
  if (process.env.TRUST_PROXY_IP === "1") {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) headers.set("x-forwarded-for", forwarded);
  }
  try {
    let body: string | undefined;
    if (!["GET", "HEAD"].includes(request.method)) {
      const max = 12 * 1024 * 1024;
      if (Number(request.headers.get("content-length") || 0) > max)
        return Response.json({ detail: "Request too large" }, { status: 413 });
      const reader = request.body?.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      if (reader)
        while (true) {
          const item = await reader.read();
          if (item.done) break;
          size += item.value.byteLength;
          if (size > max) {
            await reader.cancel();
            return Response.json(
              { detail: "Request too large" },
              { status: 413 },
            );
          }
          chunks.push(item.value);
        }
      const joined = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        joined.set(chunk, offset);
        offset += chunk.byteLength;
      }
      body = new TextDecoder().decode(joined);
    }
    const response = await fetch(upstream, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    });
    const result = new Headers();
    for (const name of [
      "content-type",
      "cache-control",
      "content-disposition",
      "retry-after",
      "x-request-id",
    ]) {
      const value = response.headers.get(name);
      if (value) result.set(name, value);
    }
    for (const cookie of response.headers.getSetCookie())
      result.append("set-cookie", cookie);
    result.set("Cache-Control", "no-store");
    return new Response(response.body, {
      status: response.status,
      headers: result,
    });
  } catch {
    return Response.json(
      {
        detail:
          "Autentifikatsiya serveriga ulanib bo‘lmadi. Qayta urinib ko‘ring.",
      },
      { status: 503 },
    );
  }
}
export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
