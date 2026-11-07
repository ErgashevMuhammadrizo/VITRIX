"use client";
import { useTranslator } from "../../i18n/runtime";
import { AdminSubscriptions } from "./admin-subscriptions";
import { AccountId, accountId } from "../../components/ui/account-id";
import { useState, useEffect } from "react";
import { authApi } from "../../services/auth";
import { productCapacity } from "../../services/plans";
import Link from "next/link";
import {
  Users,
  Store,
  Globe,
  Package,
  CreditCard,
  Eye,
  Search,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Check,
  ArrowUpRight,
} from "lucide-react";
import { useApp } from "../../stores/app-store";
import {
  Button,
  Field,
  Modal,
  Confirm,
  Empty,
  Pagination,
  UploadImage,
} from "../../components/ui/shared";
import { ProductManager } from "../products/product-manager";
import { Stats } from "../dashboard/dashboard";
import { date, money, uid } from "../../lib/utils";
import type { Plan, User } from "../../types";
import { toast } from "sonner";
export function AdminPage({ section }: { section: string }) {
  const __t = useTranslator();
  return section === "" ? (
    <AdminOverview />
  ) : section === "users" ? (
    <UserManager />
  ) : section === "businesses" ? (
    <BusinessManager />
  ) : section === "subscriptions" ? (
    <>
      <AdminSubscriptions />
      <details className="panel">
        <summary>{__t("Tarif sozlamalari")}</summary>
        <Plans />
      </details>
    </>
  ) : section === "products" ? (
    <ProductManager monitor />
  ) : section === "settings" ? (
    <PlatformSettings />
  ) : (
    <Empty title={__t("Sahifa topilmadi")} />
  );
}
function AdminOverview() {
  const __t = useTranslator();
  const { db } = useApp();
  const active = db.businesses.filter(
    (b) => new Date(b.expires) > new Date(),
  ).length;
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">{__t("PLATFORMA NAZORAT MARKAZI")}</span>
          <h1>{__t("Platforma holati")}</h1>
          <p>{__t("Bizneslar, foydalanuvchilar va obunalar bir joyda.")}</p>
        </div>
        <span className="badge blue">
          <ShieldCheck size={14} />
          {__t("SUPERADMIN")}
        </span>
      </div>
      <Stats
        items={[
          {
            label: __t("Foydalanuvchilar"),
            value: db.users.length,
            icon: Users,
          },
          { label: __t("Bizneslar"), value: db.businesses.length, icon: Store },
          {
            label: __t("Jami saytlar"),
            value: db.businesses.length,
            icon: Globe,
          },
          {
            label: __t("Faol saytlar"),
            value: db.businesses.filter((b) => b.active).length,
            icon: Globe,
          },
          {
            label: __t("Mahsulotlar"),
            value: db.products.length,
            icon: Package,
          },
          { label: __t("Faol obunalar"), value: active, icon: CreditCard },
          {
            label: __t("Tugagan obunalar"),
            value: db.businesses.length - active,
            icon: CreditCard,
          },
          {
            label: __t("Jami tashriflar"),
            value: db.events.filter((e) => e.kind === "visit").reduce((sum, event) => sum + (event.count ?? 1), 0),
            icon: Eye,
          },
        ]}
      />
      <div className="panel">
        <div className="between">
          <h3>{__t("So\u2018nggi ro\u2018yxatdan o\u2018tganlar")}</h3>
          <Link href="/admin/users" className="text-link">
            {__t("Barchasi")}
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{__t("Foydalanuvchi")}</th>
                <th>{__t("Email")}</th>
                <th>{__t("Rol")}</th>
                <th>{__t("Ro\u2018yxatdan o\u2018tgan")}</th>
                <th>{__t("Holat")}</th>
              </tr>
            </thead>
            <tbody>
              {[...db.users]
                .reverse()
                .slice(0, 6)
                .map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.firstName} {u.lastName}
                    </td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{date(u.createdAt, __t.language)}</td>
                    <td>
                      <span className={`badge ${u.active ? "green" : "gray"}`}>
                        {u.active ? __t("Faol") : __t("Faolsiz")}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
function UserManager() {
  const __t = useTranslator();
  const { db, update, user, reload } = useApp();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<User>();
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    let active = true;
    authApi
      .users()
      .then(({ users }) => {
        if (active)
          update((d) => {
            d.users = users;
          }, "");
      })
      .catch((e) => {
        if (active) setLoadError(__t(e.message));
      });
    return () => {
      active = false;
    };
  }, []);
  const [del, setDel] = useState<User>();
  const items = db.users.filter(
    (u) =>
      (
        accountId(u.id) +
        " " +
        u.firstName +
        " " +
        u.lastName +
        " " +
        u.email +
        " " +
        u.username
      )
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (!status || String(u.active) === status),
  );
  const current = Math.min(page, Math.max(1, Math.ceil(items.length / 8)));
  return (
    <>
      <div className="page-title">
        <div>
          <h1>{__t("Foydalanuvchilar")}</h1>
          <p>{__t("Akkauntlar va ularga tegishli bizneslar.")}</p>
        </div>
      </div>
      {loadError && (
        <p className="error" role="alert">
          {loadError}
        </p>
      )}
      <div className="toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            placeholder={__t("Ism, email yoki username\u2026")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          aria-label={__t("Foydalanuvchi holati")}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">{__t("Barcha holatlar")}</option>
          <option value="true">{__t("Faol")}</option>
          <option value="false">{__t("Faolsiz")}</option>
        </select>
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>{__t("Foydalanuvchi")}</th>
              <th>{__t("Email")}</th>
              <th>{__t("Rol")}</th>
              <th>{__t("Holat")}</th>
              <th>{__t("Amallar")}</th>
            </tr>
          </thead>
          <tbody>
            {items.slice((current - 1) * 8, current * 8).map((u) => (
              <tr key={u.id}>
                <td>
                  <button className="text-link" onClick={() => setDetail(u)}>
                    {u.firstName} {u.lastName}
                  </button>
                  <small className="block muted">@{u.username}</small>
                  <AccountId id={u.accountId || u.id} />
                </td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <span className={`badge ${u.active ? "green" : "gray"}`}>
                    {u.active ? __t("Faol") : __t("Faolsiz")}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <Button
                      variant="secondary small"
                      disabled={u.id === user?.id}
                      onClick={async () => {
                        try {
                          const result = await authApi.setActive(
                            u.id,
                            !u.active,
                          );
                          update((d) => {
                            d.users = d.users.map((i) =>
                              i.id === u.id ? result.user : i,
                            );
                          });
                        } catch (e) {
                          toast.error(
                            e instanceof Error
                              ? __t(e.message)
                              : __t("So\u2018rov bajarilmadi."),
                          );
                        }
                      }}
                    >
                      {u.active
                        ? __t("Faolsizlantirish")
                        : __t("Faollashtirish")}
                    </Button>
                    <button
                      className="icon-btn red"
                      title={__t("O\u2018chirish")}
                      disabled={u.id === user?.id}
                      onClick={() => setDel(u)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && <Empty />}
      </div>
      <Pagination page={current} total={items.length} onChange={setPage} />
      {detail && (
        <Modal
          title={__t("Foydalanuvchi tafsilotlari")}
          onClose={() => setDetail(undefined)}
        >
          <h3>
            {detail.firstName} {detail.lastName}
          </h3>
          <p>
            {detail.email}
            <br />
            {detail.phone}
            <br />@{detail.username}
          </p>
          <h4>{__t("Bizneslar")}</h4>
          {db.businesses
            .filter((b) => b.ownerId === detail.id)
            .map((b) => (
              <div className="callout" key={b.id}>
                <strong>{b.name}</strong>
                <p>
                  {__t("Yaratilgan:")}
                  {date(b.createdAt, __t.language)}
                </p>
                <Link href={`/${b.slug}`} target="_blank" className="text-link">
                  {__t("Saytni ochish")}
                  <ExternalLink size={15} />
                </Link>
              </div>
            ))}
        </Modal>
      )}
      {del && (
        <Confirm
          title={__t(
            "Foydalanuvchi va uning barcha biznes ma\u2019lumotlari o\u2018chirilsinmi?",
          )}
          onClose={() => setDel(undefined)}
          onConfirm={async () => {
            try {
              await authApi.deleteUser(del.id);
              await reload();
              toast.success(__t("Foydalanuvchi o\u2018chirildi."));
            } catch (e) {
              toast.error(
                e instanceof Error
                  ? __t(e.message)
                  : __t("O\u2018chirish bajarilmadi."),
              );
            }
          }}
        />
      )}
    </>
  );
}
function BusinessManager() {
  const __t = useTranslator();
  const { db, update } = useApp();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [detail, setDetail] = useState<string>();
  const items = db.businesses.filter(
    (b) =>
      (accountId(b.ownerId) + " " + b.name + " " + b.slug)
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (!status || String(b.active) === status),
  );
  const b = db.businesses.find((b) => b.id === detail);
  return (
    <>
      <div className="page-title">
        <div>
          <h1>{__t("Bizneslar")}</h1>
          <p>{__t("Mustaqil biznes saytlari va ularning holati.")}</p>
        </div>
      </div>
      <div className="toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            placeholder={__t("Biznes qidirish\u2026")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label={__t("Sayt holati")}
        >
          <option value="">{__t("Barcha holatlar")}</option>
          <option value="true">{__t("Faol")}</option>
          <option value="false">{__t("Faolsiz")}</option>
        </select>
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>{__t("Biznes")}</th>
              <th>{__t("Egasi")}</th>
              <th>{__t("Mahsulotlar")}</th>
              <th>{__t("Yaratilgan")}</th>
              <th>{__t("Holat")}</th>
              <th>{__t("Amallar")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id}>
                <td>
                  <button className="text-link" onClick={() => setDetail(b.id)}>
                    {b.name}
                  </button>
                  <small className="block muted">/{b.slug}</small>
                  <AccountId id={b.accountId || b.ownerId} />
                </td>
                <td>
                  {db.users.find((u) => u.id === b.ownerId)?.email ?? "—"}
                </td>
                <td>
                  {db.products.filter((p) => p.businessId === b.id).length}
                </td>
                <td>{date(b.createdAt, __t.language)}</td>
                <td>
                  <span className={`badge ${b.active ? "green" : "gray"}`}>
                    {b.active ? __t("Faol") : __t("Faolsiz")}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <Button
                      variant="secondary small"
                      onClick={() =>
                        update((d) => {
                          const target = d.businesses.find(
                            (i) => i.id === b.id,
                          );
                          if (target) target.active = !target.active;
                        })
                      }
                    >
                      {b.active ? __t("To\u2018xtatish") : __t("Yoqish")}
                    </Button>
                    <Link
                      href={`/${b.slug}`}
                      target="_blank"
                      title={__t("Saytni ko\u2018rish")}
                    >
                      <ExternalLink size={16} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && <Empty />}
      </div>
      {b && (
        <Modal title={b.name} onClose={() => setDetail(undefined)}>
          <AccountId id={b.accountId || b.ownerId} />
          <p>
            <Link
              href={`/admin/subscriptions?q=${accountId(b.ownerId)}`}
              className="btn"
            >
              {__t("Obunani boshqarish")}
            </Link>
          </p>
          <p>{b.description}</p>
          <p>
            {b.phone} · @{b.telegram}
          </p>
          <p>{b.address}</p>
          <p>
            {__t("Obuna:")}
            {db.plans.find((p) => p.id === b.planId)?.name} ·{" "}
            {date(b.expires, __t.language)}
          </p>
          <Link className="btn" href={`/${b.slug}`} target="_blank">
            {__t("Public sayt")}
            <ArrowUpRight size={16} />
          </Link>
        </Modal>
      )}
    </>
  );
}
function Plans() {
  const __t = useTranslator();
  const { db, update, reviewPlan } = useApp();
  const [edit, setEdit] = useState<Plan | null | undefined>();
  const [del, setDel] = useState<Plan>();
  return (
    <>
      <div className="page-title">
        <div>
          <h1>{__t("Obunalar va tariflar")}</h1>
          <p>{__t("Tarif imkoniyatlari va bizneslarning obuna muddatlari.")}</p>
        </div>
        <Button onClick={() => setEdit(null)}>
          <Plus size={17} />
          {__t("Tarif yaratish")}
        </Button>
      </div>
      <div className="pricing-grid">
        {db.plans.map((p) => (
          <article className="price-card" key={p.id}>
            <h3>{__t(p.name)}</h3>
            <div className="price">{money(p.price, __t.language)}</div>
            <small>
              {p.duration}
              {__t("kun \u00B7")}
              {__t(productCapacity(p))}
              {__t("mahsulot")}
            </small>
            <p className="preserve">{__t(p.features)}</p>
            <div className="actions">
              <Button variant="secondary small" onClick={() => setEdit(p)}>
                <Pencil size={14} />
                {__t("Tahrirlash")}
              </Button>
              <button
                className="icon-btn red"
                title={__t("Tarifni o\u2018chirish")}
                onClick={() => {
                  if (db.businesses.some((b) => b.planId === p.id)) {
                    toast.error(
                      __t(
                        "Bu tarifda bizneslar bor. Avval ularning tarifini almashtiring.",
                      ),
                    );
                    return;
                  }
                  setDel(p);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {edit !== undefined && (
        <PlanEditor plan={edit} onClose={() => setEdit(undefined)} />
      )}{" "}
      {del && (
        <Confirm
          title={__t("Tarif o\u2018chirilsinmi?")}
          onClose={() => setDel(undefined)}
          onConfirm={() =>
            update((d) => {
              d.plans = d.plans.filter((p) => p.id !== del.id);
            })
          }
        />
      )}
    </>
  );
}
function PlanEditor({
  plan,
  onClose,
}: {
  plan: Plan | null;
  onClose: () => void;
}) {
  const __t = useTranslator();
  const { update } = useApp();
  const [v, setV] = useState<Plan>(
    plan ?? {
      id: uid(),
      name: "",
      price: 0,
      duration: 30,
      limit: null,
      features: "",
    },
  );
  return (
    <Modal
      title={plan ? __t("Tarifni tahrirlash") : __t("Yangi tarif")}
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (
            await update((d) => {
              if (plan) d.plans = d.plans.map((p) => (p.id === v.id ? v : p));
              else d.plans.push(v);
            })
          )
            onClose();
        }}
      >
        <Field label={__t("Tarif nomi")}>
          <input
            required
            minLength={2}
            value={v.name}
            onChange={(e) => setV({ ...v, name: e.target.value })}
          />
        </Field>
        {(["price", "duration"] as const).map((k, i) => (
          <Field
            key={k}
            label={
              [
                __t("Narx (so\u2018m)"),
                __t("Davomiyligi (kun)"),
                __t("Mahsulot limiti"),
              ][i]
            }
          >
            <input
              type="number"
              required
              min={k === "price" ? 0 : 1}
              value={v[k]}
              onChange={(e) => setV({ ...v, [k]: Number(e.target.value) })}
            />
          </Field>
        ))}
        <label className="check">
          <input
            type="checkbox"
            checked={v.limit === null}
            onChange={(e) =>
              setV({ ...v, limit: e.target.checked ? null : 1000 })
            }
          />
          {__t("Cheksiz mahsulotlar")}
        </label>
        {v.limit !== null && (
          <Field label={__t("Mahsulot limiti")}>
            <input
              required
              type="number"
              min="1"
              value={v.limit}
              onChange={(e) => setV({ ...v, limit: Number(e.target.value) })}
            />
          </Field>
        )}
        <Field label={__t("Analitika (kun)")}>
          <select
            value={v.analyticsDays ?? 7}
            onChange={(e) =>
              setV({ ...v, analyticsDays: Number(e.target.value) })
            }
          >
            <option value={7}>{__t("7 kun")}</option>
            <option value={90}>{__t("90 kun")}</option>
          </select>
        </Field>
        <label className="check">
          <input
            type="checkbox"
            checked={!!v.csvExport}
            onChange={(e) => setV({ ...v, csvExport: e.target.checked })}
          />
          {__t("CSV eksporti")}
        </label>
        <Field label={__t("Imkoniyatlar (har qatorga bittadan)")}>
          <textarea
            required
            rows={5}
            value={v.features}
            onChange={(e) => setV({ ...v, features: e.target.value })}
          />
        </Field>
        <Button>{__t("Saqlash")}</Button>
      </form>
    </Modal>
  );
}
function PlatformSettings() {
  const __t = useTranslator();
  const { db, update } = useApp();
  const [v, setV] = useState(db.platform);
  return (
    <>
      <div className="page-title">
        <div>
          <h1>{__t("Platforma sozlamalari")}</h1>
          <p>{__t("Brend va umumiy aloqa ma\u2019lumotlari.")}</p>
        </div>
      </div>
      <form
        className="panel narrow"
        onSubmit={async (e) => {
          e.preventDefault();
          update((d) => {
            d.platform = v;
          });
        }}
      >
        <Field label={__t("Platforma nomi")}>
          <input
            required
            minLength={2}
            value={v.name}
            onChange={(e) => setV({ ...v, name: e.target.value })}
          />
        </Field>
        <Field label={__t("Logo")}>
          <UploadImage
            value={v.logo}
            onChange={(logo) => setV({ ...v, logo })}
          />
        </Field>
        <Field label={__t("Email")}>
          <input
            type="email"
            required
            value={v.email}
            onChange={(e) => setV({ ...v, email: e.target.value })}
          />
        </Field>
        <Field label={__t("Telefon")}>
          <input
            type="tel"
            required
            value={v.phone}
            onChange={(e) => setV({ ...v, phone: e.target.value })}
          />
        </Field>
        <Field label={__t("Obunalar uchun Telegram")}>
          <input
            placeholder="@username"
            maxLength={33}
            pattern="@?[A-Za-z][A-Za-z0-9_]{3,31}"
            value={v.subscriptionTelegram || ""}
            onChange={(e) =>
              setV({ ...v, subscriptionTelegram: e.target.value })
            }
          />
          <small>
            {__t(
              "Tugma shu akkaunt bilan suhbatni ochadi. Xabarda akkaunt ID, do\u2018kon, sayt va tarif avtomatik yoziladi.",
            )}
          </small>
        </Field>
        <Field label={__t("Tavsif")}>
          <textarea
            required
            value={v.description}
            onChange={(e) => setV({ ...v, description: e.target.value })}
          />
        </Field>
        <Button>{__t("Saqlash")}</Button>
        <Link className="text-link" href="/admin/subscriptions">
          {__t("Tarif narxlarini boshqarish")}
          <ArrowUpRight size={16} />
        </Link>
      </form>
    </>
  );
}
