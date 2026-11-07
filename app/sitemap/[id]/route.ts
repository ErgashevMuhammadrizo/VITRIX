import {
  siteOrigin,
  xml,
  sitemapPage,
} from "../../../src/services/sitemap-server";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    const { id } = await params;
    if (!/^(main|businesses-\d+|products-\d+)\.xml$/.test(id))
      return new Response(null, { status: 404 });
    const value = id.replace(/\.xml$/, "");
    let urls: string[];
    if (value === "main")
      urls = ["", "/features", "/about", "/contact"].map(
        (path) => siteOrigin() + path,
      );
    else {
      const [kind, page] = value.split("-");
      const result = await sitemapPage(kind, Number(page));
      urls = result.items.flatMap((row) =>
        ["uz", "ru", "en"].map(
          (lang) =>
            siteOrigin() +
            "/" +
            row.slug +
            (row.product ? "/p/" + row.product : "") +
            "?lang=" +
            lang,
        ),
      );
    }
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
        urls.map((url) => "<url><loc>" + xml(url) + "</loc></url>").join("") +
        "</urlset>",
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
