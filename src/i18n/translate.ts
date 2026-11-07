import catalogue from "./catalogue.json";
import type { Language } from "./index";
const entries = catalogue as Record<
  string,
  {
    ru: string;
    en: string;
  }
>;
export function translate(
  value: unknown,
  language: Language = "uz",
  variables?: Record<string, unknown>,
): string {
  if (value == null) return "";
  const raw = String(value);
  const key = raw.replace(/\s+/g, " ").trim();
  const found = entries[key];
  if (raw.includes("\n") && !found)
    return raw
      .split("\n")
      .map((line) => translate(line, language, variables))
      .join("\n");
  let text = language === "uz" ? key : found?.[language] || key;
  if (!found && language !== "uz") {
    const max = key.match(/^String must contain at most (\d+) character\(s\)$/);
    if (max)
      text =
        language === "ru"
          ? `Не более ${max[1]} символов`
          : `At most ${max[1]} characters`;
    const min = key.match(
      /^String must contain at least (\d+) character\(s\)$/,
    );
    if (min)
      text =
        language === "ru"
          ? `Не менее ${min[1]} символов`
          : `At least ${min[1]} characters`;
    const numeric = key.match(/^(\d+) ta mahsulot$/);
    if (numeric)
      text =
        language === "ru" ? numeric[1] + " товаров" : numeric[1] + " products";
  }
  text = text.replace(/\{(\w+)\}/g, (match, k) =>
    variables && k in variables ? String(variables[k]) : match,
  );
  const leading = /^\s/.test(raw) ? " " : "";
  const trailing = /\s$/.test(raw) ? " " : "";
  return leading + text + trailing;
}
export function createTranslator(language: Language) {
  return Object.assign(
    (value: unknown, variables?: Record<string, unknown>) =>
      translate(value, language, variables),
    { language },
  );
}
