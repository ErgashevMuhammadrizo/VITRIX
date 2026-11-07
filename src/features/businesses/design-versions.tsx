"use client";
import { useState } from "react";
import type { Business } from "../../types";
import { designsApi } from "../../services/workspace";
import { useApp } from "../../stores/app-store";
import { useTranslator } from "../../i18n/runtime";
import { Button } from "../../components/ui/shared";
export function DesignVersions({ business }: { business: Business }) {
  const t = useTranslator();
  const { reload } = useApp();
  const [versions, setVersions] = useState<
    {
      id: number;
      createdAt: string;
    }[]
  >([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section className="design-version-list panel">
      <Button
        variant="secondary small"
        disabled={busy}
        onClick={async () => {
          setOpen(!open);
          setBusy(true);
          try {
            setVersions((await designsApi.list(business.id)).versions);
            setError("");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {t("Saqlangan dizaynlar tarixi")}
      </Button>
      {open && (
        <>
          <p className="muted">
            {t(
              "Oldingi saqlangan dizaynni tiklang. Mahsulotlar va obuna o‘zgarmaydi.",
            )}
          </p>
          {!versions.length && <p>{t("Hali saqlangan versiya yo‘q.")}</p>}
          {versions.map((v) => (
            <div className="between" key={v.id}>
              <time>
                {new Date(v.createdAt).toLocaleString(
                  t.language === "ru"
                    ? "ru-RU"
                    : t.language === "en"
                      ? "en-US"
                      : "uz-UZ",
                  { timeZone: "Asia/Tashkent" },
                )}
              </time>
              <Button
                variant="secondary small"
                disabled={busy}
                onClick={async () => {
                  if (
                    !confirm(
                      t(
                        "Saqlangan dizayn tiklansinmi? Saqlanmagan tahrirlar almashtiriladi.",
                      ),
                    )
                  )
                    return;
                  setBusy(true);
                  try {
                    await designsApi.restore(
                      business.id,
                      v.id,
                      business.revision || 1,
                    );
                    await reload();
                    setError("");
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {t("Tiklash")}
              </Button>
            </div>
          ))}
        </>
      )}
      {error && <p role="alert">{t(error)}</p>}
    </section>
  );
}
