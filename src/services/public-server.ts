import type { PublicCatalog } from "./workspace";
export async function loadPublic(
  slug: string,
  params: Record<string, string> = {},
): Promise<{
  data?: PublicCatalog;
  redirect?: string;
  missing?: boolean;
  error?: string;
}> {
  const origin = process.env.DJANGO_API_URL;
  if (!origin)
    return {
      error: "Sayt xizmati hali sozlanmagan. Keyinroq qayta urinib ko‘ring.",
    };
  try {
    const response = await fetch(
      new URL(
        "/api/v1/public/businesses/" +
          encodeURIComponent(slug) +
          "/?" +
          new URLSearchParams(params),
        origin,
      ),
      { cache: "no-store", signal: AbortSignal.timeout(10000) },
    );
    if (response.status === 404 || response.status === 410)
      return { missing: true };
    if (!response.ok) return { error: "Sayt xizmati vaqtincha javob bermadi." };
    const value = (await response.json()) as PublicCatalog & {
      redirect?: string;
    };
    if (value.redirect) return { redirect: value.redirect };
    return {
      data: { ...value, focusProduct: params.product } as PublicCatalog,
    };
  } catch {
    return {
      error: "Sayt xizmati bilan aloqa uzildi. Keyinroq qayta urinib ko‘ring.",
    };
  }
}
