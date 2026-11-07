import { loadPublic } from "../../../src/services/public-server";
export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      slug: string;
    }>;
  },
) {
  const { slug } = await params;
  const result = await loadPublic(slug);
  if (!result.data) return new Response("Not found", { status: 404 });
  const b = result.data.business;
  const letter = b.name.slice(0, 1).replace(/[<>&"']/g, "");
  const color = /^#[0-9a-f]{6}$/i.test(b.primary) ? b.primary : "#315bea";
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${color}"/><text x="32" y="45" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="40" font-weight="700">${letter}</text></svg>`,
    {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}
