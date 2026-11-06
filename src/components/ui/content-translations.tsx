"use client";
import { useTranslator } from "../../i18n/runtime";
import { useState } from "react";
import type { ContentTranslations } from "../../types";
import type { Language } from "../../i18n";
import { Field } from "./shared";
export function ContentTranslationsEditor({
  value = {},
  onChange,
  fields,
}: {
  value?: ContentTranslations;
  onChange: (v: ContentTranslations) => void;
  fields: {
    key: string;
    label: string;
    max: number;
    multiline?: boolean;
  }[];
}) {
  const __t = useTranslator();
  const [language, setLanguage] = useState<Language>("ru");
  return (
    <details className="content-translations">
      <summary>{__t("UZ / RU / EN \u2014 matn tarjimalari")}</summary>
      <p className="muted">
        {__t(
          "Har bir tildagi matnni kiriting. Bo\u2018sh maydon asosiy matnni ko\u2018rsatadi; avtomatik tarjima qilinmaydi.",
        )}
      </p>
      <div className="segmented">
        {(["uz", "ru", "en"] as const).map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={language === l}
            className={language === l ? "active" : ""}
            onClick={() => setLanguage(l)}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      {fields.map((f) => (
        <Field key={f.key} label={f.label}>
          {f.multiline ? (
            <textarea
              maxLength={f.max}
              rows={3}
              value={value[language]?.[f.key] || ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  [language]: { ...value[language], [f.key]: e.target.value },
                })
              }
            />
          ) : (
            <input
              maxLength={f.max}
              value={value[language]?.[f.key] || ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  [language]: { ...value[language], [f.key]: e.target.value },
                })
              }
            />
          )}
        </Field>
      ))}
    </details>
  );
}
