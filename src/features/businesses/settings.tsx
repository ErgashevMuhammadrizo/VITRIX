"use client";
import { useState, useEffect } from "react";
import { Check, Save, ExternalLink, Smartphone, Monitor } from "lucide-react";
import { useApp, recordActivity } from "../../stores/app-store";
import type { Business } from "../../types";
import {
  Button,
  Field,
  UploadImage,
  SiteLink,
  useDirtyWarning,
} from "../../components/ui/shared";
import { BusinessSite } from "../../components/public-website/business-site";
import { reserved } from "../../lib/utils";
import { AppearanceControls } from "./appearance-controls";
import { LocationPicker } from "../location/location-picker";
import { validCoordinates, safeMapUrl } from "../location/location-utils";
import { toast } from "sonner";
export function BusinessSettings({
  business,
  contacts = false,
}: {
  business: Business;
  contacts?: boolean;
}) {
  const { db, update } = useApp();
  const [v, setV] = useState(business);
  useEffect(() => setV(business), [business]);
  const dirty = JSON.stringify(v) !== JSON.stringify(business);
  useDirtyWarning(dirty);
  const set = (k: keyof Business, value: string) => setV({ ...v, [k]: value });
  return (
    <>
      <div className="page-title">
        <div>
          <h1>{contacts ? "Aloqa ma’lumotlari" : "Sayt sozlamalari"}</h1>
          <p>Saytingizdagi ma’lumotlar shu yerdan yangilanadi.</p>
        </div>
        <span className={`badge ${dirty ? "amber" : "green"}`}>
          {dirty ? "Saqlanmagan o‘zgarishlar" : "Barcha o‘zgarishlar saqlangan"}
        </span>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (
            !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.slug) ||
            reserved.includes(v.slug) ||
            db.businesses.some((b) => b.id !== v.id && b.slug === v.slug)
          ) {
            toast.error(
              "Slug band yoki noto‘g‘ri. Lotin harflari, raqam va tire ishlating.",
            );
            return;
          }
          if (
            v.telegram &&
            !/^(?:@|https?:\/\/t\.me\/)?[A-Za-z][A-Za-z0-9_]{3,31}$/.test(
              v.telegram,
            )
          ) {
            toast.error("Telegram username noto‘g‘ri");
            return;
          }
          if (
            (v.latitude != null || v.longitude != null) &&
            !validCoordinates(v.latitude, v.longitude)
          ) {
            toast.error("Ikkala koordinatani ham to‘g‘ri kiriting.");
            return;
          }
          if (v.mapUrl && !safeMapUrl(v.mapUrl)) {
            toast.error("Xarita HTTPS havolasini tekshiring.");
            return;
          }
          update((d) => {
            d.businesses = d.businesses.map((b) => (b.id === v.id ? v : b));
            recordActivity(d, v.id, "Sayt ma’lumotlari yangilandi");
          });
        }}
      >
        <div className="settings-columns">
          <section className="panel">
            <h2>
              {contacts ? "Mijozlar sizga qanday bog‘lanadi?" : "Biznes haqida"}
            </h2>
            {!contacts && (
              <>
                <Field label="Biznes nomi *">
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    value={v.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </Field>
                <Field label="Sayt manzili (slug) *">
                  <input
                    required
                    maxLength={64}
                    value={v.slug}
                    onChange={(e) => set("slug", e.target.value.toLowerCase())}
                  />
                </Field>
                <SiteLink slug={v.slug} />
                <Field label="Biznes tavsifi">
                  <textarea
                    required
                    maxLength={600}
                    rows={4}
                    value={v.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </Field>
              </>
            )}
            <div className="form-grid">
              <Field label="Telefon *">
                <input
                  type="tel"
                  required
                  pattern="[+0-9 ()-]{9,20}"
                  value={v.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
              <Field label="Telegram username">
                <input
                  placeholder="@burgerhouse"
                  value={v.telegram}
                  onChange={(e) => set("telegram", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Manzil">
              <input
                value={v.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
            <LocationPicker value={v} onChange={setV} />
            <Field label="Ish vaqti">
              <input
                value={v.hours}
                onChange={(e) => set("hours", e.target.value)}
              />
            </Field>
            <Field label="Instagram havolasi">
              <input
                type="url"
                value={v.instagram}
                onChange={(e) => set("instagram", e.target.value)}
              />
            </Field>
            {!contacts && (
              <Field label="Sayt tili">
                <select
                  value={v.language}
                  onChange={(e) => set("language", e.target.value)}
                >
                  <option value="uz">O‘zbekcha</option>
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </Field>
            )}
          </section>
          {!contacts && (
            <section className="panel">
              <h2>Brend rasmlari</h2>
              <Field label="Biznes logosi">
                <UploadImage value={v.logo} onChange={(s) => set("logo", s)} />
              </Field>
              <Field label="Banner rasmi">
                <UploadImage
                  value={v.cover}
                  onChange={(s) => set("cover", s)}
                />
              </Field>
              <div className="callout">
                <h3>Mustaqil sayt havolasi</h3>
                <p>
                  Mijozlar bu havolani ochganda to‘g‘ridan-to‘g‘ri
                  katalogingizga kiradi.
                </p>
                <SiteLink slug={v.slug} />
              </div>
              <label className="check">
                <input
                  type="checkbox"
                  checked={v.active}
                  onChange={(e) => setV({ ...v, active: e.target.checked })}
                />
                Saytni e’lon qilish
              </label>
            </section>
          )}
        </div>
        <div className="save-bar">
          <span>
            {dirty
              ? "O‘zgarishlaringizni saqlang."
              : "Ma’lumotlar yangilangan."}
          </span>
          <Button type="submit" disabled={!dirty}>
            <Save size={17} />
            O‘zgarishlarni saqlash
          </Button>
        </div>
      </form>
    </>
  );
}
export function DesignSettings({ business }: { business: Business }) {
  const { update } = useApp();
  const [v, setV] = useState(business);
  useEffect(() => setV(business), [business]);
  const [mobile, setMobile] = useState(false);
  const dirty = JSON.stringify(v) !== JSON.stringify(business);
  useDirtyWarning(dirty);
  const set = (k: keyof Business, s: string) => setV({ ...v, [k]: s });
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Dizayn va brending</h1>
          <p>O‘z uslubingizni yarating. Natijani darhol ko‘ring.</p>
        </div>
        <Button
          disabled={!dirty}
          onClick={() =>
            update((d) => {
              d.businesses = d.businesses.map((b) => (b.id === v.id ? v : b));
            }, "Dizayn saqlandi")
          }
        >
          <Save size={17} />
          Saqlash
        </Button>
      </div>
      <div className="design-layout">
        <aside className="panel design-controls">
          <h3>Tayyor uslublar</h3>
          <div className="theme-choices">
            {(["minimal", "modern", "elegant"] as const).map((theme) => (
              <button
                key={theme}
                className={v.theme === theme ? "chosen" : ""}
                onClick={() => set("theme", theme)}
              >
                <span className={`theme-swatch ${theme}`}>
                  <i />
                  <b />
                  <em />
                </span>
                {theme[0].toUpperCase() + theme.slice(1)}
                {v.theme === theme && <Check size={15} />}
              </button>
            ))}
          </div>
          <AppearanceControls value={v} onChange={setV} />
          {(
            [
              [
                "font",
                "Shrift",
                [
                  ["sans", "Zamonaviy Sans"],
                  ["serif", "Klassik Serif"],
                  ["rounded", "Yumshoq"],
                  ["system", "Tizim shrifti"],
                ],
              ],
              [
                "layout",
                "Katalog joylashuvi",
                [
                  ["grid", "Grid"],
                  ["list", "Ro‘yxat"],
                ],
              ],
              [
                "header",
                "Header uslubi",
                [
                  ["center", "Keng"],
                  ["compact", "Ixcham"],
                ],
              ],
              [
                "buttons",
                "Aloqa tugmalari",
                [
                  ["solid", "To‘ldirilgan"],
                  ["outline", "Kontur"],
                ],
              ],
            ] as const
          ).map(([key, label, options]) => (
            <Field key={key} label={label}>
              <select value={v[key]} onChange={(e) => set(key, e.target.value)}>
                {options.map(([value, name]) => (
                  <option key={value} value={value}>
                    {name}
                  </option>
                ))}
              </select>
            </Field>
          ))}
          <Field label="Logo">
            <UploadImage value={v.logo} onChange={(s) => set("logo", s)} />
          </Field>
          <Field label="Banner">
            <UploadImage value={v.cover} onChange={(s) => set("cover", s)} />
          </Field>
        </aside>
        <section className="design-preview">
          <div className="between preview-bar">
            <span>
              <span className="live-dot" /> Jonli ko‘rinish
            </span>
            <div className="segmented">
              <button
                aria-label="Desktop preview"
                className={!mobile ? "active" : ""}
                onClick={() => setMobile(false)}
              >
                <Monitor size={17} />
              </button>
              <button
                aria-label="Mobile preview"
                className={mobile ? "active" : ""}
                onClick={() => setMobile(true)}
              >
                <Smartphone size={17} />
              </button>
            </div>
          </div>
          <div className={mobile ? "preview-mobile" : "preview-desktop"}>
            <BusinessSite business={v} preview />
          </div>
        </section>
      </div>
    </>
  );
}
