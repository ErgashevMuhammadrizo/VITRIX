import {
  siteOrigin,
  xml,
  sitemapPage,
} from "../../src/services/sitemap-server";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const [b, p] = await Promise.all([
      sitemapPage("businesses", 1),
      sitemapPage("products", 1),
    ]);
    const ids = [
      "main",
      ...["businesses", "products"].flatMap((kind, i) =>
        Array.from(
          { length: Math.ceil([b, p][i].pagination.total / 100) },
          (_, n) => kind + "-" + (n + 1),
        ),
      ),
    ];
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
        ids
          .map(
            (id) =>
              "<sitemap><loc>" +
              xml(siteOrigin() + "/sitemap/" + id + ".xml") +
              "</loc></sitemap>",
          )
          .join("") +
        "</sitemapindex>",
      {
        headers: {
          "Content-Type": "application/xml",
          "Cache-Control": "public, max-age=300",
        },
      },
    );
  } catch {
    return new Response("Sitemap temporarily unavailable", { status: 503 });
  }
}
