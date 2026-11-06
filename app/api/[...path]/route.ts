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
  for (const name of ["content-type", "cookie", "x-csrftoken", "origin"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const response = await fetch(upstream, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method)
        ? undefined
        : await request.text(),
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    });
    const result = new Headers();
    for (const name of ["content-type", "cache-control"]) {
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
