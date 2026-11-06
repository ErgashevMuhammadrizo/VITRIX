const hosts = [
  "google.com",
  "google.uz",
  "maps.app.goo.gl",
  "goo.gl",
  "yandex.com",
  "yandex.uz",
  "yandex.ru",
  "maps.apple.com",
  "openstreetmap.org",
  "2gis.uz",
];
export function validCoordinates(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}
export function safeMapUrl(value: string): string {
  try {
    const u = new URL(value);
    return u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      hosts.some((h) => u.hostname === h || u.hostname.endsWith("." + h))
      ? u.href
      : "";
  } catch {
    return "";
  }
}
export function parseMapCoordinates(value: string): [number, number] | null {
  if (!safeMapUrl(value)) return null;
  const u = new URL(value);
  const at = u.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  let values = at ? [Number(at[1]), Number(at[2])] : null;
  const q = u.searchParams.get("q") || u.searchParams.get("query");
  if (q && /^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(q))
    values = q.split(",").map(Number);
  const ll = u.searchParams.get("ll");
  if (ll && u.hostname.includes("yandex"))
    values = ll.split(",").map(Number).reverse();
  const osm = u.hash.match(/map=\d+\/(-?[\d.]+)\/(-?[\d.]+)/);
  if (osm) values = [Number(osm[1]), Number(osm[2])];
  return values && validCoordinates(values[0], values[1])
    ? [values[0], values[1]]
    : null;
}
export function mapLink(b: {
  latitude?: number | null;
  longitude?: number | null;
  mapUrl?: string;
}) {
  return validCoordinates(b.latitude, b.longitude)
    ? `https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`
    : safeMapUrl(b.mapUrl || "");
}
export function osmEmbed(lat: number, lng: number) {
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.008},${lat - 0.005},${lng + 0.008},${lat + 0.005}&layer=mapnik&marker=${lat},${lng}`;
}
