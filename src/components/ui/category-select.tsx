"use client";
import { useState } from "react";
import { useCollection } from "../../hooks/use-collection";
import { useApp } from "../../stores/app-store";
import type { Category } from "../../types";
import { useTranslator } from "../../i18n/runtime";
import { Pagination } from "./shared";
export function CategorySelect({
  businessId,
  value,
  onChange,
}: {
  businessId: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useTranslator();
  const { db } = useApp();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const query = useCollection<Category>("categories", {
    businessId,
    q,
    page,
    pageSize: 8,
  });
  const selected = db.categories.find((c) => c.id === value);
  return (
    <div className="category-picker">
      <input
        aria-label={t("Kategoriya qidirish")}
        placeholder={t("Kategoriya qidirish")}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
      />
      <select
        aria-label={t("Kategoriya")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t("Kategoriyasiz")}</option>
        {value && !query.items.some((c) => c.id === value) && (
          <option value={value}>{selected?.name || value}</option>
        )}
        {query.items.map((c) => (
          <option value={c.id} key={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {query.total > 8 && (
        <Pagination page={page} total={query.total} onChange={setPage} />
      )}{" "}
      {query.error && <p role="alert">{t(query.error)}</p>}
    </div>
  );
}
