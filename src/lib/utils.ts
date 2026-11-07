export const money = (n: number, language: "uz" | "ru" | "en" = "uz") =>
  new Intl.NumberFormat(
    language === "ru" ? "ru-RU" : language === "en" ? "en-US" : "uz-UZ",
  ).format(n) +
  (language === "ru" ? " сум" : language === "en" ? " UZS" : " so‘m");
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[‘’'`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
export const date = (s: string, language: "uz" | "ru" | "en" = "uz") =>
  new Date(s).toLocaleDateString(
    language === "ru" ? "ru-RU" : language === "en" ? "en-GB" : "uz-UZ",
  );
export const reserved = [
  "dashboard",
  "admin",
  "login",
  "register",
  "forgot-password",
  "pricing",
  "features",
  "about",
  "contact",
  "terms",
  "privacy",
  "api",
  "media",
  "demo",
  "images",
  "icon",
  "favicon.svg",
  "_next",
  "500",
];
export const telegram = (s: string, message?: string) => {
  const name = s
    .replace(/^https?:\/\/t.me\//, "")
    .replace("@", "")
    .split(/[/?]/)[0];
  return `https://t.me/${encodeURIComponent(name)}${message ? "?text=" + encodeURIComponent(message) : ""}`;
};
