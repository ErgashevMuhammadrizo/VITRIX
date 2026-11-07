"use client";
import { useNow } from "../../hooks/use-now";
import { useCollection } from "../../hooks/use-collection";
import { ActivationHistory } from "./activation-history";
import { useTranslator } from "../../i18n/runtime";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useApp } from "../../stores/app-store";
import {
  Button,
  Field,
  Modal,
  Empty,
  Pagination,
} from "../../components/ui/shared";
import { AccountId } from "../../components/ui/account-id";
import { workspaceApi } from "../../services/workspace";
import { date, money } from "../../lib/utils";
import type { Business } from "../../types";
import { toast } from "sonner";
export function AdminSubscriptions() {
  const __t = useTranslator();
  const { db, reviewPlan } = useApp();
  const search = useSearchParams();
  const [q, setQ] = useState(search.get("q") || "");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Business>();
  const pending = (id: string) =>
    db.subscriptionRequests?.some(
      (r) => r.businessId === id && r.status === "pending",
    );
  const query = useCollection<Business>("businesses", {
    q,
    subscription: filter,
    page,
    pageSize: 10,
  });
  const items = query.items;
  const current = page;
  return (
    <>
      <div className="page-title">
        <div>
          <h1>{__t("Obunalarni boshqarish")}</h1>
          <p>
            {__t(
              "ID yoki do\u2018kon orqali toping, to\u2018lovni tekshiring va obunani yoqing.",
            )}
          </p>
        </div>
      </div>
      <div className="toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            placeholder={__t("VX-ID, do\u2018kon, email yoki telefon\u2026")}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          aria-label={__t("Obuna holati")}
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{__t("Barchasi")}</option>
          <option value="pending">{__t("Ariza kelgan")}</option>
          <option value="active">{__t("Faol")}</option>
          <option value="expired">{__t("Muddati tugagan")}</option>
        </select>
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>{__t("Akkaunt ID")}</th>
              <th>{__t("Do\u2018kon")}</th>
              <th>{__t("Tarif")}</th>
              <th>{__t("Muddat")}</th>
              <th>{__t("Amal")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id}>
                <td>
                  <AccountId id={b.accountId || b.ownerId} />
                </td>
                <td>
                  <b>{b.name}</b>
                  <small className="block muted">/{b.slug}</small>
                  {pending(b.id) && (
                    <span className="badge amber">
                      {__t("Telegram arizasi")}
                    </span>
                  )}
                </td>
                <td>{db.plans.find((p) => p.id === b.planId)?.name}</td>
                <td>
                  {date(b.expires, __t.language)}
                  <small className="block muted">
                    {new Date(b.expires) > new Date()
                      ? __t("Faol")
                      : __t("Tugagan")}
                  </small>
                </td>
                <td>
                  <Button variant="small" onClick={() => setSelected(b)}>
                    {__t("Obunani yoqish")}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && <Empty title={__t("Biznes topilmadi")} />}
      </div>
      <Pagination
        page={current}
        total={query.total}
        size={10}
        onChange={setPage}
      />
      {(db.subscriptionRequests || [])
        .filter((r) => r.status === "pending")
        .map((r) => (
          <div className="callout between" key={r.id}>
            <span>
              {db.businesses.find((b) => b.id === r.businessId)?.name} ·{" "}
              {db.plans.find((p) => p.id === r.planId)?.name}
            </span>
            <div className="actions">
              <Button
                variant="small"
                onClick={() =>
                  setSelected(db.businesses.find((b) => b.id === r.businessId))
                }
              >
                {__t("Ko\u2018rib chiqish")}
              </Button>
              <Button
                variant="secondary small"
                onClick={() =>
                  reviewPlan(r.id, false).catch((e) =>
                    toast.error(__t(e.message)),
                  )
                }
              >
                {__t("Rad etish")}
              </Button>
            </div>
          </div>
        ))}
      <ActivationHistory />
      {selected && (
        <Activation
          business={selected}
          onClose={() => setSelected(undefined)}
        />
      )}
    </>
  );
}
function Activation({
  business: b,
  onClose,
}: {
  business: Business;
  onClose: () => void;
}) {
  const __t = useTranslator();
  const { db, reload } = useApp();
  const pending = db.subscriptionRequests?.find(
    (r) => r.businessId === b.id && r.status === "pending",
  );
  const paid = db.plans.filter((p) => p.price > 0);
  const [planId, setPlan] = useState(
    pending?.planId ||
      b.pendingPlanId ||
      (paid.some((p) => p.id === b.planId) ? b.planId : paid[0]?.id || ""),
  );
  const [months, setMonths] = useState(1);
  const [mode, setMode] = useState("extend");
  const [note, setNote] = useState("");
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const plan = paid.find((p) => p.id === planId);
  const now = useNow();
  const expiry = new Date(
    (mode === "extend" ? Math.max(now, new Date(b.expires).getTime()) : now) +
      months * 30 * 86400000,
  ).toISOString();
  const changed = () => {
    setKey(crypto.randomUUID());
    setConfirmed(false);
  };
  return (
    <Modal
      title={__t("Obunani faollashtirish")}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <h3>{b.name}</h3>
      <AccountId id={b.accountId || b.ownerId} />
      <p>
        {__t("Hozirgi muddat:")}
        {date(b.expires, __t.language)}
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!confirmed || busy) return;
          setBusy(true);
          try {
            await workspaceApi.activateSubscription(b.id, {
              planId,
              months,
              mode,
              note,
              idempotencyKey: key,
            });
            await reload();
            toast.success(__t("Obuna faollashtirildi."));
            onClose();
          } catch (e) {
            toast.error(
              e instanceof Error ? __t(e.message) : __t("Amal bajarilmadi."),
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={busy}>
          <Field label={__t("Tarif")}>
            <select
              required
              value={planId}
              onChange={(e) => {
                setPlan(e.target.value);
                changed();
              }}
            >
              {paid.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {money(p.price, __t.language)}
                  {__t("/oy")}
                </option>
              ))}
            </select>
          </Field>
          <Field label={__t("Muddat")}>
            <select
              value={months}
              onChange={(e) => {
                setMonths(Number(e.target.value));
                changed();
              }}
            >
              {[1, 3, 6, 12].map((n) => (
                <option key={n} value={n}>
                  {n}
                  {__t("oy (")}
                  {n * 30}
                  {__t("kun)")}
                </option>
              ))}
            </select>
          </Field>
          <Field label={__t("Boshlanishi")}>
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                changed();
              }}
            >
              <option value="extend">
                {__t("Joriy muddatdan uzaytirish")}
              </option>
              <option value="restart">{__t("Bugundan boshlash")}</option>
            </select>
          </Field>
          <Field label={__t("To\u2018lov yoki admin izohi")}>
            <textarea
              maxLength={300}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                changed();
              }}
            />
          </Field>
          <div className="callout">
            {__t("To\u2018lov:")}
            <b>{money((plan?.price || 0) * months, __t.language)}</b>
            <br />
            {__t("Yangi muddat:")}
            <b>{date(expiry, __t.language)}</b>
          </div>
          <label className="check">
            <input
              type="checkbox"
              required
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            {__t(
              "To\u2018lovni tekshirdim, do\u2018kon va muddat to\u2018g\u2018ri",
            )}
          </label>
          <Button disabled={!confirmed || !plan}>
            {busy ? "Saqlanmoqda…" : __t("Obunani faollashtirish")}
          </Button>
        </fieldset>
      </form>
    </Modal>
  );
}
