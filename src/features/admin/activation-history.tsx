"use client";
import { useEffect, useState } from "react";
import { collectionApi } from "../../services/workspace";
import { useApp } from "../../stores/app-store";
import { useTranslator } from "../../i18n/runtime";
import { Pagination } from "../../components/ui/shared";
import { date } from "../../lib/utils";
type Row = {
  id: string;
  businessName: string;
  planName: string;
  months: number;
  newExpiry: string;
  createdAt: string;
  actor: string;
  note: string;
};
export function ActivationHistory() {
  const t = useTranslator();
  const { dataRevision } = useApp();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    collectionApi<Row>("activations", { page, pageSize: 10 })
      .then((result) => {
        if (active) {
          setItems(result.items);
          setTotal(result.pagination.total);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [page, dataRevision]);
  return (
    <section className="panel">
      <h2>{t("Faollashtirish tarixi")}</h2>
      {error && <p role="alert">{t(error)}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {["Biznes", "Tarif", "Muddat", "Administrator", "Sana"].map(
                (k) => (
                  <th key={k}>{t(k)}</th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <td>{r.businessName}</td>
                <td>
                  {r.planName} · {r.months} {t("oy")}
                </td>
                <td>{date(r.newExpiry, t.language)}</td>
                <td>
                  {r.actor}
                  <small className="block muted">{r.note}</small>
                </td>
                <td>{date(r.createdAt, t.language)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} size={10} onChange={setPage} />
    </section>
  );
}
