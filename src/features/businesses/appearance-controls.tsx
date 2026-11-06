"use client";
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
  const a = appearanceOf(value);
  const set = (key: keyof Business, v: unknown) =>
    onChange({ ...value, [key]: v });
  return (
    <div className="appearance-controls">
      <h3>Saytingiz, o‘z uslubingiz</h3>
      <p className="muted">
        Rang, joylashuv va bo‘limlarni o‘zingizga moslang.
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
            {["Oq", "Qora", "Oq-qora"][i]}
          </button>
        ))}
      </div>
      <div className="palette-grid">
        {palettes.map((p) => (
          <button
            type="button"
            key={p.name}
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
              {p.name}
            </span>
          </button>
        ))}
      </div>
      <details>
        <summary>Ranglarni alohida sozlash</summary>
        <div className="form-grid">
          {(
            [
              ["backgroundColor", "Sahifa foni"],
              ["surfaceColor", "Karta foni"],
              ["textColor", "Asosiy matn"],
              ["surfaceTextColor", "Karta matni"],
              ["mutedColor", "Yordamchi matn"],
              ["primary", "Asosiy rang"],
              ["secondary", "Banner foni"],
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
      <Field label="Banner sarlavhasi">
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
            "Banner",
            [
              ["split", "Rasm yonma-yon"],
              ["cover", "Keng rasm"],
              ["minimal", "Faqat matn"],
            ],
          ],
          [
            "contentWidth",
            "Sayt kengligi",
            [
              ["full", "To‘liq ekran"],
              ["wide", "Keng"],
              ["compact", "Ixcham"],
            ],
          ],
          [
            "cornerStyle",
            "Burchaklar",
            [
              ["sharp", "To‘g‘ri"],
              ["soft", "Yumshoq"],
              ["round", "Yumaloq"],
            ],
          ],
          [
            "density",
            "Oraliqlar",
            [
              ["comfortable", "Keng"],
              ["compact", "Ixcham"],
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
            ["productColumns", "Kompyuter: ustunlar", [2, 3, 4]],
            ["mobileColumns", "Telefon: ustunlar", [1, 2]],
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
      <h4>Ko‘rinadigan bo‘limlar</h4>
      {(
        [
          ["showHero", "Banner"],
          ["showSearch", "Qidirish"],
          ["showCategories", "Kategoriyalar"],
          ["showPrices", "Narxlar"],
          ["showContacts", "Aloqa tugmalari"],
          ["showLocation", "Manzil va xarita"],
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
