import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
}: {
  params: Promise<{ path: string[] }>;
}): Promise<Metadata> {
  const { path } = await params;
  if (path.length === 1 && !platformRoutes.includes(path[0])) {
    const result = await loadPublic(path[0]);
    if (result.data) {
      const b = result.data.business;
      const origin =
        process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const cover = b.cover
        ? b.cover.startsWith("http")
          ? b.cover
          : origin + b.cover
        : undefined;
      return {
        title: { absolute: b.name },
        description: b.description,
        icons: { icon: b.logo || "/icon/" + b.slug },
        openGraph: {
          type: "website",
          title: b.name,
          description: b.description,
          url: origin + "/" + b.slug,
          ...(cover ? { images: [{ url: cover, alt: b.name }] } : {}),
        },
        twitter: {
          card: cover ? "summary_large_image" : "summary",
          title: b.name,
          description: b.description,
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
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  if (!platformRoutes.includes(path[0])) {
    if (path.length !== 1) notFound();
    const result = await loadPublic(path[0]);
    if (result.missing) notFound();
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
