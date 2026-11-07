import type { PublicCatalog } from "./workspace";
export async function loadPublic(
  slug: string,
): Promise<{ data?: PublicCatalog; missing?: boolean; error?: string }> {
  const origin = process.env.DJANGO_API_URL;
  if (!origin)
    return {
      error: "Sayt xizmati hali sozlanmagan. Keyinroq qayta urinib ko‘ring.",
    };
  try {
    const response = await fetch(
      new URL(
        "/api/v1/public/businesses/" + encodeURIComponent(slug) + "/",
        origin,
      ),
      { cache: "no-store", signal: AbortSignal.timeout(10000) },
    );
    if (response.status === 404 || response.status === 410)
      return { missing: true };
    if (!response.ok) return { error: "Sayt xizmati vaqtincha javob bermadi." };
    return { data: (await response.json()) as PublicCatalog };
  } catch {
    return {
      error: "Sayt xizmati bilan aloqa uzildi. Keyinroq qayta urinib ko‘ring.",
    };
  }
}
