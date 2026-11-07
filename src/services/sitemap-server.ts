export type SitemapPage = {
  items: {
    slug: string;
    product?: string;
  }[];
  pagination: {
    total: number;
  };
};
export const siteOrigin = () =>
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";
export const xml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
export async function sitemapPage(
  kind: string,
  page: number,
): Promise<SitemapPage> {
  const api = process.env.DJANGO_API_URL;
  if (!api) return { items: [], pagination: { total: 0 } };
  const response = await fetch(
    new URL("/api/v1/public/sitemap/?type=" + kind + "&page=" + page, api),
    { cache: "no-store", signal: AbortSignal.timeout(10000) },
  );
  if (!response.ok) throw new Error("Sitemap backend unavailable");
  return response.json() as Promise<SitemapPage>;
}
