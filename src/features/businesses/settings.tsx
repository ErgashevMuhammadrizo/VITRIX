"use client";
import { useTranslator } from "../../i18n/runtime";
import { useState, useEffect } from "react";
import { ContentTranslationsEditor } from "../../components/ui/content-translations";
import { Check, Save, Smartphone, Monitor } from "lucide-react";
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
import { DesignVersions } from "./design-versions";
import { resetDesign } from "./appearance";
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
  const __t = useTranslator();
  const { db, update } = useApp();
  const [v, setV] = useState(business);
  // Replace the draft only when the canonical server record changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setV(business), [business]);
  const dirty = JSON.stringify(v) !== JSON.stringify(business);
  useDirtyWarning(dirty);
  const set = (k: keyof Business, value: string) => setV({ ...v, [k]: value });
  return (
    <>
      <div className="page-title">
        <div>
          <h1>
            {contacts
              ? __t("Aloqa ma\u2019lumotlari")
              : __t("Sayt sozlamalari")}
          </h1>
          <p>{__t("Saytingizdagi ma\u2019lumotlar shu yerdan yangilanadi.")}</p>
        </div>
        <span className={`badge ${dirty ? "amber" : "green"}`}>
          {dirty
            ? __t("Saqlanmagan o\u2018zgarishlar")
            : __t("Barcha o\u2018zgarishlar saqlangan")}
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
              __t(
                "Slug band yoki noto\u2018g\u2018ri. Lotin harflari, raqam va tire ishlating.",
              ),
            );
            return;
          }
          if (
            v.telegram &&
            !/^(?:@|https?:\/\/t\.me\/)?[A-Za-z][A-Za-z0-9_]{3,31}$/.test(
              v.telegram,
            )
          ) {
            toast.error(__t("Telegram username noto\u2018g\u2018ri"));
            return;
          }
          if (
            (v.latitude != null || v.longitude != null) &&
            !validCoordinates(v.latitude, v.longitude)
          ) {
            toast.error(
              __t("Ikkala koordinatani ham to\u2018g\u2018ri kiriting."),
            );
            return;
          }
          if (v.mapUrl && !safeMapUrl(v.mapUrl)) {
            toast.error(__t("Xarita HTTPS havolasini tekshiring."));
            return;
          }
          update((d) => {
            d.businesses = d.businesses.map((b) => (b.id === v.id ? v : b));
            recordActivity(d, v.id, __t("Sayt ma\u2019lumotlari yangilandi"));
          });
        }}
      >
        <div className="settings-columns">
          <section className="panel">
            <h2>
              {contacts
                ? __t("Mijozlar sizga qanday bog\u2018lanadi?")
                : __t("Biznes haqida")}
            </h2>
            {!contacts && (
              <>
                <Field label={__t("Biznes nomi *")}>
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    value={v.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </Field>
                <Field label={__t("Sayt manzili (slug) *")}>
                  <input
                    required
                    maxLength={64}
                    value={v.slug}
                    onChange={(e) => set("slug", e.target.value.toLowerCase())}
                  />
                </Field>
                <SiteLink slug={v.slug} />
                <Field label={__t("Biznes tavsifi")}>
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
              <Field label={__t("Telefon *")}>
                <input
                  type="tel"
                  required
                  pattern="[+0-9 ()-]{9,20}"
                  value={v.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
              <Field label={__t("Telegram username")}>
                <input
                  placeholder="@burgerhouse"
                  value={v.telegram}
                  onChange={(e) => set("telegram", e.target.value)}
                />
              </Field>
            </div>
            <Field label={__t("Manzil")}>
              <input
                value={v.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
            <ContentTranslationsEditor
              value={v.translations}
              onChange={(translations) => setV({ ...v, translations })}
              fields={[
                { key: "name", label: __t("Biznes nomi"), max: 100 },
                {
                  key: "description",
                  label: __t("Biznes tavsifi"),
                  max: 2000,
                  multiline: true,
                },
                { key: "address", label: __t("Manzil"), max: 300 },
                { key: "hours", label: __t("Ish vaqti"), max: 120 },
                { key: "heroTitle", label: __t("Banner sarlavhasi"), max: 140 },
              ]}
            />
            <LocationPicker value={v} onChange={setV} />
            <Field label={__t("Ish vaqti")}>
              <input
                value={v.hours}
                onChange={(e) => set("hours", e.target.value)}
              />
            </Field>
            <Field label={__t("Instagram havolasi")}>
              <input
                type="url"
                value={v.instagram}
                onChange={(e) => set("instagram", e.target.value)}
              />
            </Field>
            {!contacts && (
              <Field label={__t("Sayt tili")}>
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
              <h2>{__t("Brend rasmlari")}</h2>
              <Field label={__t("Biznes logosi")}>
                <UploadImage value={v.logo} onChange={(s) => set("logo", s)} />
              </Field>
              <Field label={__t("Banner rasmi")}>
                <UploadImage
                  value={v.cover}
                  onChange={(s) => set("cover", s)}
                />
              </Field>
              <div className="callout">
                <h3>{__t("Mustaqil sayt havolasi")}</h3>
                <p>
                  {__t(
                    "Mijozlar bu havolani ochganda to\u2018g\u2018ridan-to\u2018g\u2018ri katalogingizga kiradi.",
                  )}
                </p>
                <SiteLink slug={v.slug} />
              </div>
              <label className="check">
                <input
                  type="checkbox"
                  checked={v.active}
                  onChange={(e) => setV({ ...v, active: e.target.checked })}
                />
                {__t("Saytni e\u2019lon qilish")}
              </label>
            </section>
          )}
        </div>
        <div className="save-bar">
          <span>
            {dirty
              ? __t("O\u2018zgarishlaringizni saqlang.")
              : __t("Ma\u2019lumotlar yangilangan.")}
          </span>
          <Button type="submit" disabled={!dirty}>
            <Save size={17} />
            {__t("O\u2018zgarishlarni saqlash")}
          </Button>
        </div>
      </form>
    </>
  );
}
export function DesignSettings({ business }: { business: Business }) {
  const __t = useTranslator();
  const { db, update } = useApp();
  const [v, setV] = useState(business);
  const [history, setHistory] = useState<Business[]>([]);
  const [future, setFuture] = useState<Business[]>([]);
  useEffect(() => {
    // A saved server record becomes the new undo baseline.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setV(business);
    setHistory([]);
    setFuture([]);
  }, [business]);
  const change = (next: Business) => {
    setHistory((h) => [...h, v].slice(-50));
    setFuture([]);
    setV(next);
  };
  const undo = () => {
    const previous = history.at(-1);
    if (previous) {
      setFuture((f) => [v, ...f]);
      setHistory((h) => h.slice(0, -1));
      setV(previous);
    }
  };
  const redo = () => {
    const next = future[0];
    if (next) {
      setHistory((h) => [...h, v]);
      setFuture((f) => f.slice(1));
      setV(next);
    }
  };
  const [mobile, setMobile] = useState(false);
  const dirty = JSON.stringify(v) !== JSON.stringify(business);
  useDirtyWarning(dirty);
  const set = (k: keyof Business, s: string) => change({ ...v, [k]: s });
  return (
    <>
      <div className="page-title">
        <div>
          <h1>{__t("Dizayn va brending")}</h1>
          <p>
            {__t(
              "O\u2018z uslubingizni yarating. Natijani darhol ko\u2018ring.",
            )}
          </p>
        </div>
        <Button
          disabled={!dirty}
          onClick={() =>
            update((d) => {
              d.businesses = d.businesses.map((b) => (b.id === v.id ? v : b));
            }, __t("Dizayn saqlandi"))
          }
        >
          <Save size={17} />
          {__t("Saqlash")}
        </Button>
      </div>
      <div className="design-history toolbar">
        <Button
          variant="secondary small"
          disabled={!history.length}
          onClick={undo}
        >
          {__t("Ortga")}
        </Button>
        <Button
          variant="secondary small"
          disabled={!future.length}
          onClick={redo}
        >
          {__t("Oldinga")}
        </Button>
        <Button
          variant="secondary small"
          disabled={!dirty}
          onClick={() => change(business)}
        >
          {__t("Saqlangan holatga qaytish")}
        </Button>
        <Button
          variant="secondary small"
          onClick={() => {
            if (
              confirm(
                __t(
                  "Dizayn boshlang\u2018ich holatga qaytarilsinmi? Mahsulot va aloqa ma\u2019lumotlari saqlanadi.",
                ),
              )
            )
              change(resetDesign(v));
          }}
        >
          {__t("Boshlang\u2018ich dizayn")}
        </Button>
        <small>
          {__t("O\u2018zgarishlar Saqlash bosilganda saytda qo\u2018llanadi.")}
        </small>
      </div>
      <DesignVersions business={business} />
      <div className="design-layout">
        <aside className="panel design-controls">
          <h3>{__t("Tayyor uslublar")}</h3>
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
                {__t(theme[0].toUpperCase() + theme.slice(1))}
                {v.theme === theme && <Check size={15} />}
              </button>
            ))}
          </div>
          <AppearanceControls value={v} onChange={change} />
          {(
            [
              [
                "font",
                __t("Shrift"),
                [
                  ["sans", __t("Zamonaviy Sans")],
                  ["serif", __t("Klassik Serif")],
                  ["rounded", __t("Yumshoq")],
                  ["system", __t("Tizim shrifti")],
                ],
              ],
              [
                "layout",
                __t("Katalog joylashuvi"),
                [
                  ["grid", __t("Grid")],
                  ["list", __t("Ro\u2018yxat")],
                ],
              ],
              [
                "header",
                __t("Header uslubi"),
                [
                  ["center", __t("Keng")],
                  ["compact", __t("Ixcham")],
                ],
              ],
              [
                "buttons",
                __t("Aloqa tugmalari"),
                [
                  ["solid", __t("To\u2018ldirilgan")],
                  ["outline", __t("Kontur")],
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
          <Field label={__t("Logo")}>
            <UploadImage value={v.logo} onChange={(s) => set("logo", s)} />
          </Field>
          <Field label={__t("Banner")}>
            <UploadImage value={v.cover} onChange={(s) => set("cover", s)} />
          </Field>
        </aside>
        <section className="design-preview">
          <div className="between preview-bar">
            <span>
              <span className="live-dot" />
              {__t("Jonli ko\u2018rinish")}
            </span>
            <div className="segmented">
              <button
                aria-label={__t("Desktop preview")}
                className={!mobile ? "active" : ""}
                onClick={() => setMobile(false)}
              >
                <Monitor size={17} />
              </button>
              <button
                aria-label={__t("Mobile preview")}
                className={mobile ? "active" : ""}
                onClick={() => setMobile(true)}
              >
                <Smartphone size={17} />
              </button>
            </div>
          </div>
          <div className={mobile ? "preview-mobile" : "preview-desktop"}>
            <BusinessSite
              business={v}
              data={{
                business: v,
                products: db.products,
                categories: db.categories,
              }}
              compactPreview
              preview
            />
          </div>
        </section>
      </div>
    </>
  );
}
