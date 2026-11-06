"use client";
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
import { AccountId, accountId } from "../../components/ui/account-id";
import { workspaceApi } from "../../services/workspace";
import { date, money } from "../../lib/utils";
import type { Business } from "../../types";
import { toast } from "sonner";
export function AdminSubscriptions() {
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
  const items = db.businesses.filter((b) => {
    const u = db.users.find((u) => u.id === b.ownerId);
    return (
      [b.name, b.slug, accountId(b.ownerId), u?.email, u?.username, u?.phone]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (!filter ||
        (filter === "pending"
          ? pending(b.id)
          : filter === "active"
            ? new Date(b.expires) > new Date()
            : new Date(b.expires) <= new Date()))
    );
  });
  const current = Math.min(page, Math.max(1, Math.ceil(items.length / 10)));
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Obunalarni boshqarish</h1>
          <p>
            ID yoki do‘kon orqali toping, to‘lovni tekshiring va obunani yoqing.
          </p>
        </div>
      </div>
      <div className="toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            placeholder="VX-ID, do‘kon, email yoki telefon…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          aria-label="Obuna holati"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Barchasi</option>
          <option value="pending">Ariza kelgan</option>
          <option value="active">Faol</option>
          <option value="expired">Muddati tugagan</option>
        </select>
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Akkaunt ID</th>
              <th>Do‘kon</th>
              <th>Tarif</th>
              <th>Muddat</th>
              <th>Amal</th>
            </tr>
          </thead>
          <tbody>
            {items.slice((current - 1) * 10, current * 10).map((b) => (
              <tr key={b.id}>
                <td>
                  <AccountId id={b.accountId || b.ownerId} />
                </td>
                <td>
                  <b>{b.name}</b>
                  <small className="block muted">/{b.slug}</small>
                  {pending(b.id) && (
                    <span className="badge amber">Telegram arizasi</span>
                  )}
                </td>
                <td>{db.plans.find((p) => p.id === b.planId)?.name}</td>
                <td>
                  {date(b.expires)}
                  <small className="block muted">
                    {new Date(b.expires) > new Date() ? "Faol" : "Tugagan"}
                  </small>
                </td>
                <td>
                  <Button variant="small" onClick={() => setSelected(b)}>
                    Obunani yoqish
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && <Empty title="Biznes topilmadi" />}
      </div>
      <Pagination
        page={current}
        total={items.length}
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
                Ko‘rib chiqish
              </Button>
              <Button
                variant="secondary small"
                onClick={() =>
                  reviewPlan(r.id, false).catch((e) => toast.error(e.message))
                }
              >
                Rad etish
              </Button>
            </div>
          </div>
        ))}
      <details className="panel subscription-history">
        <summary>Faollashtirish tarixi</summary>
        {(db.subscriptionActivations || []).length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Do‘kon</th>
                  <th>Tarif / muddat</th>
                  <th>Yangi tugash sanasi</th>
                  <th>Admin va izoh</th>
                </tr>
              </thead>
              <tbody>
                {db.subscriptionActivations!.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {db.businesses.find((b) => b.id === a.businessId)?.name}
                    </td>
                    <td>
                      {db.plans.find((p) => p.id === a.planId)?.name} ·{" "}
                      {a.months} oy
                    </td>
                    <td>{date(a.newExpiry)}</td>
                    <td>
                      {a.actor}
                      <small className="block muted">
                        {date(a.createdAt)} · {a.note}
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Hali faollashtirishlar yo‘q.</p>
        )}
      </details>
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
  const { db, reload } = useApp();
  const pending = db.subscriptionRequests?.find(
    (r) => r.businessId === b.id && r.status === "pending",
  );
  const paid = db.plans.filter((p) => p.price > 0);
  const [planId, setPlan] = useState(
    pending?.planId ||
      (paid.some((p) => p.id === b.planId) ? b.planId : paid[0]?.id || ""),
  );
  const [months, setMonths] = useState(1);
  const [mode, setMode] = useState("extend");
  const [note, setNote] = useState("");
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const plan = paid.find((p) => p.id === planId);
  const expiry = new Date(
    (mode === "extend"
      ? Math.max(Date.now(), new Date(b.expires).getTime())
      : Date.now()) +
      months * 30 * 86400000,
  ).toISOString();
  const changed = () => {
    setKey(crypto.randomUUID());
    setConfirmed(false);
  };
  return (
    <Modal
      title="Obunani faollashtirish"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <h3>{b.name}</h3>
      <AccountId id={b.accountId || b.ownerId} />
      <p>Hozirgi muddat: {date(b.expires)}</p>
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
            toast.success("Obuna faollashtirildi.");
            onClose();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Amal bajarilmadi.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={busy}>
          <Field label="Tarif">
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
                  {p.name} — {money(p.price)}/oy
                </option>
              ))}
            </select>
          </Field>
          <Field label="Muddat">
            <select
              value={months}
              onChange={(e) => {
                setMonths(Number(e.target.value));
                changed();
              }}
            >
              {[1, 3, 6, 12].map((n) => (
                <option key={n} value={n}>
                  {n} oy ({n * 30} kun)
                </option>
              ))}
            </select>
          </Field>
          <Field label="Boshlanishi">
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                changed();
              }}
            >
              <option value="extend">Joriy muddatdan uzaytirish</option>
              <option value="restart">Bugundan boshlash</option>
            </select>
          </Field>
          <Field label="To‘lov yoki admin izohi">
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
            To‘lov: <b>{money((plan?.price || 0) * months)}</b>
            <br />
            Yangi muddat: <b>{date(expiry)}</b>
          </div>
          <label className="check">
            <input
              type="checkbox"
              required
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            To‘lovni tekshirdim, do‘kon va muddat to‘g‘ri
          </label>
          <Button disabled={!confirmed || !plan}>
            {busy ? "Saqlanmoqda…" : "Obunani faollashtirish"}
          </Button>
        </fieldset>
      </form>
    </Modal>
  );
}
