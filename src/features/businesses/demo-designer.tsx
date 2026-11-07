"use client";
import { useTranslator } from "../../i18n/runtime";
import { useState } from "react";
import Link from "next/link";
import { seed } from "../../mocks/seed";
import { BusinessSite } from "../../components/public-website/business-site";
import { AppearanceControls } from "./appearance-controls";
import { Button } from "../../components/ui/shared";
export function DemoDesigner() {
  const __t = useTranslator();
  const [b, setB] = useState(seed.businesses[0]);
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="demo-design-bar">
        <span>{__t("VITRIX namuna sayti")}</span>
        <div className="actions">
          <Button variant="secondary small" onClick={() => setOpen(!open)}>
            {open
              ? __t("Sozlamalarni yopish")
              : __t("Dizaynni sinab ko\u2018rish")}
          </Button>
          <Link href="/register" className="text-link">
            {__t("O\u2018z saytingizni yaratish \u2197")}
          </Link>
        </div>
      </div>
      {open && (
        <aside className="demo-design-panel">
          <p className="muted">
            {__t("Bu namuna. O\u2018zgarishlar saqlanmaydi.")}
          </p>
          <AppearanceControls value={b} onChange={setB} />
        </aside>
      )}
      <BusinessSite
        business={b}
        preview
        data={{
          business: b,
          products: seed.products,
          categories: seed.categories,
        }}
      />
    </>
  );
}
