"use client";
import { useTranslator } from "../../i18n/runtime";
import type { Business } from "../../types";
import { Field } from "../../components/ui/shared";
import { appearanceOf, palettes } from "./appearance";
export function AppearanceControls({
  value,
  onChange,
}: {
  value: Business;
  onChange: (v: Business) => void;
}) {
  const __t = useTranslator();
  const a = appearanceOf(value);
  const set = (key: keyof Business, v: unknown) =>
    onChange({ ...value, [key]: v });
  return (
    <div className="appearance-controls">
      <h3>{__t("Saytingiz, o\u2018z uslubingiz")}</h3>
      <p className="muted">
        {__t("Rang, joylashuv va bo\u2018limlarni o\u2018zingizga moslang.")}
      </p>
      <div className="segmented">
        {(["light", "dark", "contrast"] as const).map((mode, i) => (
          <button
            type="button"
            key={mode}
            aria-pressed={a.colorMode === mode}
            className={a.colorMode === mode ? "active" : ""}
            onClick={() => onChange({ ...value, ...palettes[i].colors })}
          >
            {[__t("Oq"), __t("Qora"), __t("Oq-qora")][i]}
          </button>
        ))}
      </div>
      <div className="palette-grid">
        {palettes.map((p) => (
          <button
            type="button"
            key={__t(p.name)}
            onClick={() => onChange({ ...value, ...p.colors })}
            className="palette-option"
          >
            <span
              style={{
                background: p.colors.backgroundColor,
                color: p.colors.textColor,
              }}
            >
              <i style={{ background: p.colors.primary }} />
              {__t(p.name)}
            </span>
          </button>
        ))}
      </div>
      <details>
        <summary>{__t("Ranglarni alohida sozlash")}</summary>
        <div className="form-grid">
          {(
            [
              ["backgroundColor", __t("Sahifa foni")],
              ["surfaceColor", __t("Karta foni")],
              ["textColor", __t("Asosiy matn")],
              ["surfaceTextColor", __t("Karta matni")],
              ["mutedColor", __t("Yordamchi matn")],
              ["primary", __t("Asosiy rang")],
              ["secondary", __t("Banner foni")],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                type="color"
                value={a[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </Field>
          ))}
        </div>
      </details>
      <Field label={__t("Banner sarlavhasi")}>
        <input
          maxLength={140}
          value={a.heroTitle}
          placeholder={value.name}
          onChange={(e) => set("heroTitle", e.target.value)}
        />
      </Field>
      {(
        [
          [
            "heroStyle",
            __t("Banner"),
            [
              ["split", __t("Rasm yonma-yon")],
              ["cover", __t("Keng rasm")],
              ["minimal", __t("Faqat matn")],
            ],
          ],
          [
            "contentWidth",
            __t("Sayt kengligi"),
            [
              ["full", __t("To\u2018liq ekran")],
              ["wide", __t("Keng")],
              ["compact", __t("Ixcham")],
            ],
          ],
          [
            "cornerStyle",
            __t("Burchaklar"),
            [
              ["sharp", __t("To\u2018g\u2018ri")],
              ["soft", __t("Yumshoq")],
              ["round", __t("Yumaloq")],
            ],
          ],
          [
            "density",
            __t("Oraliqlar"),
            [
              ["comfortable", __t("Keng")],
              ["compact", __t("Ixcham")],
            ],
          ],
        ] as const
      ).map(([key, label, options]) => (
        <Field key={key} label={label}>
          <select value={a[key]} onChange={(e) => set(key, e.target.value)}>
            {options.map(([v, n]) => (
              <option key={v} value={v}>
                {n}
              </option>
            ))}
          </select>
        </Field>
      ))}
      <div className="form-grid">
        {(
          [
            ["productColumns", __t("Kompyuter: ustunlar"), [2, 3, 4]],
            ["mobileColumns", __t("Telefon: ustunlar"), [1, 2]],
          ] as const
        ).map(([key, label, options]) => (
          <Field label={label} key={key}>
            <select
              value={a[key]}
              onChange={(e) => set(key, Number(e.target.value))}
            >
              {options.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        ))}
      </div>
      <h4>{__t("Ko\u2018rinadigan bo\u2018limlar")}</h4>
      {(
        [
          ["showHero", __t("Banner")],
          ["showSearch", __t("Qidirish")],
          ["showCategories", __t("Kategoriyalar")],
          ["showPrices", __t("Narxlar")],
          ["showContacts", __t("Aloqa tugmalari")],
          ["showLocation", __t("Manzil va xarita")],
        ] as const
      ).map(([key, label]) => (
        <label className="check" key={key}>
          <input
            type="checkbox"
            checked={a[key]}
            onChange={(e) => set(key, e.target.checked)}
          />
          {label}
        </label>
      ))}
    </div>
  );
}
