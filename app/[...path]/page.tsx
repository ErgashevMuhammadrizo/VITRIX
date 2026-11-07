import { localizedContent } from "../../src/i18n/content";
import { isLanguage } from "../../src/i18n/content";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { AppRouter } from "../../src/components/app-router";
import { loadPublic } from "../../src/services/public-server";
const platformRoutes = [
  "pricing",
  "features",
  "about",
  "contact",
  "privacy",
  "terms",
  "login",
  "register",
  "forgot-password",
  "dashboard",
  "admin",
  "500",
  "demo",
];
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{
    path: string[];
  }>;
  searchParams: Promise<{
    lang?: string;
  }>;
}): Promise<Metadata> {
  const { path } = await params;
  if (
    !platformRoutes.includes(path[0]) &&
    (path.length === 1 || (path.length === 3 && path[1] === "p"))
  ) {
    const query = await searchParams;
    const requestedLanguage = isLanguage(query.lang) ? query.lang : undefined;
    const result = await loadPublic(
      path[0],
      path.length === 3 ? { product: path[2] } : {},
    );
    if (result.data) {
      const lang = requestedLanguage || (isLanguage(result.data.business.language)?result.data.business.language:"uz");
      const b = localizedContent(result.data.business, lang);
      const product = path.length === 3 ? result.data.products[0] : undefined;
      const item = product ? localizedContent(product, lang) : undefined;
      const title = item ? item.name + " | " + b.name : b.name;
      const description = item ? item.description : b.description;
      const pathname = "/" + path.join("/");
      const origin =
        process.env.SITE_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "http://localhost:3000";
      const cover = b.cover
        ? b.cover.startsWith("http")
          ? b.cover
          : origin + b.cover
        : undefined;
      return {
        title: { absolute: title },
        alternates: {
          canonical: pathname + "?lang=" + lang,
          languages: Object.fromEntries(
            ["uz", "ru", "en"].map((l) => [l, pathname + "?lang=" + l]),
          ),
        },
        description: description,
        icons: { icon: b.logo || "/icon/" + b.slug },
        openGraph: {
          type: "website",
          title: title,
          description: description,
          url: origin + pathname + "?lang=" + lang,
          ...(cover ? { images: [{ url: cover, alt: b.name }] } : {}),
        },
        twitter: {
          card: cover ? "summary_large_image" : "summary",
          title: title,
          description: description,
          ...(cover ? { images: [cover] } : {}),
        },
      };
    }
  }
  return {
    title:
      (
        {
          login: "Kirish",
          register: "Ro‘yxatdan o‘tish",
          pricing: "Tariflar",
          features: "Imkoniyatlar",
          dashboard: "Kabinet",
          admin: "Admin panel",
          demo: "Namuna sayt",
        } as Record<string, string>
      )[path[0]] || "VITRIX",
    robots: ["dashboard", "admin"].includes(path[0])
      ? { index: false, follow: false }
      : undefined,
  };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{
    path: string[];
  }>;
  searchParams: Promise<{
    lang?: string;
  }>;
}) {
  const { path } = await params;
  if (!platformRoutes.includes(path[0])) {
    if (path.length !== 1 && !(path.length === 3 && path[1] === "p"))
      notFound();
    const result = await loadPublic(
      path[0],
      path.length === 3 ? { product: path[2] } : {},
    );
    if (result.redirect)
      permanentRedirect("/" + [result.redirect, ...path.slice(1)].join("/"));
    if (path.length === 3 && result.data && !result.data.products.length)
      notFound();
    if (result.missing) notFound();
    const language = (await searchParams).lang;
    if (result.data && isLanguage(language))
      result.data.business = { ...result.data.business, language };
    return (
      <AppRouter
        path={path}
        publicData={result.data}
        publicError={result.error}
      />
    );
  }
  return <AppRouter path={path} />;
}
