import type { ContentTranslations } from "../types";
import type { Language } from "./index";
export function localizedContent<
  T extends {
    translations?: ContentTranslations;
  },
>(record: T, language: Language): T {
  const translated = record.translations?.[language];
  if (!translated) return record;
  const values = Object.fromEntries(
    Object.entries(translated).filter(
      ([, value]) => typeof value === "string" && value.trim(),
    ),
  );
  return { ...record, ...values };
}
export const isLanguage = (value: unknown): value is Language =>
  value === "uz" || value === "ru" || value === "en";
