"use client";
import { useState } from "react";
import Link from "next/link";
import { seed } from "../../mocks/seed";
import { BusinessSite } from "../../components/public-website/business-site";
import { AppearanceControls } from "./appearance-controls";
import { Button } from "../../components/ui/shared";
export function DemoDesigner() {
  const [b, setB] = useState(seed.businesses[0]);
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="demo-design-bar">
        <span>VITRIX namuna sayti</span>
        <div className="actions">
          <Button variant="secondary small" onClick={() => setOpen(!open)}>
            {open ? "Sozlamalarni yopish" : "Dizaynni sinab ko‘rish"}
          </Button>
          <Link href="/register" className="text-link">
            O‘z saytingizni yaratish ↗
          </Link>
        </div>
      </div>
      {open && (
        <aside className="demo-design-panel">
          <p className="muted">Bu namuna. O‘zgarishlar saqlanmaydi.</p>
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
