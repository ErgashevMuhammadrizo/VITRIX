"use client";
import Link from "next/link";
import { useTranslator } from "../src/i18n/runtime";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const t = useTranslator();
  return (
    <div className="guard">
      <strong className="error-code">500</strong>
      <h1>{t("Sayt vaqtincha ochilmadi")}</h1>
      <p>{t("Qayta urinib ko‘ring.")}</p>
      <button className="btn" onClick={reset}>
        {t("Qayta urinish")}
      </button>
      <Link href="/">{t("Bosh sahifa")}</Link>
    </div>
  );
}
