"use client";
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
        <summary>Tarif sozlamalari</summary>
        <Plans />
      </details>
    </>
  ) : section === "products" ? (
    <ProductManager monitor />
  ) : section === "settings" ? (
    <PlatformSettings />
  ) : (
    <Empty title="Sahifa topilmadi" />
  );
}
function AdminOverview() {
  const { db } = useApp();
  const active = db.businesses.filter(
    (b) => new Date(b.expires) > new Date(),
  ).length;
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">PLATFORMA NAZORAT MARKAZI</span>
          <h1>Platforma holati</h1>
          <p>Bizneslar, foydalanuvchilar va obunalar bir joyda.</p>
        </div>
        <span className="badge blue">
          <ShieldCheck size={14} />
          SUPERADMIN
        </span>
      </div>
      <Stats
        items={[
          { label: "Foydalanuvchilar", value: db.users.length, icon: Users },
          { label: "Bizneslar", value: db.businesses.length, icon: Store },
          { label: "Jami saytlar", value: db.businesses.length, icon: Globe },
          {
            label: "Faol saytlar",
            value: db.businesses.filter((b) => b.active).length,
            icon: Globe,
          },
          { label: "Mahsulotlar", value: db.products.length, icon: Package },
          { label: "Faol obunalar", value: active, icon: CreditCard },
          {
            label: "Tugagan obunalar",
            value: db.businesses.length - active,
            icon: CreditCard,
          },
          {
            label: "Jami tashriflar",
            value: db.events.filter((e) => e.kind === "visit").length,
            icon: Eye,
          },
        ]}
      />
      <div className="panel">
        <div className="between">
          <h3>So‘nggi ro‘yxatdan o‘tganlar</h3>
          <Link href="/admin/users" className="text-link">
            Barchasi
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Foydalanuvchi</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Ro‘yxatdan o‘tgan</th>
                <th>Holat</th>
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
                    <td>{date(u.createdAt)}</td>
                    <td>
                      <span className={`badge ${u.active ? "green" : "gray"}`}>
                        {u.active ? "Faol" : "Faolsiz"}
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
        if (active) setLoadError(e.message);
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
          <h1>Foydalanuvchilar</h1>
          <p>Akkauntlar va ularga tegishli bizneslar.</p>
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
            placeholder="Ism, email yoki username…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          aria-label="Foydalanuvchi holati"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Barcha holatlar</option>
          <option value="true">Faol</option>
          <option value="false">Faolsiz</option>
        </select>
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Foydalanuvchi</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Holat</th>
              <th>Amallar</th>
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
                    {u.active ? "Faol" : "Faolsiz"}
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
                              ? e.message
                              : "So‘rov bajarilmadi.",
                          );
                        }
                      }}
                    >
                      {u.active ? "Faolsizlantirish" : "Faollashtirish"}
                    </Button>
                    <button
                      className="icon-btn red"
                      title="O‘chirish"
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
          title="Foydalanuvchi tafsilotlari"
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
          <h4>Bizneslar</h4>
          {db.businesses
            .filter((b) => b.ownerId === detail.id)
            .map((b) => (
              <div className="callout" key={b.id}>
                <strong>{b.name}</strong>
                <p>Yaratilgan: {date(b.createdAt)}</p>
                <Link href={`/${b.slug}`} target="_blank" className="text-link">
                  Saytni ochish
                  <ExternalLink size={15} />
                </Link>
              </div>
            ))}
        </Modal>
      )}
      {del && (
        <Confirm
          title="Foydalanuvchi va uning barcha biznes ma’lumotlari o‘chirilsinmi?"
          onClose={() => setDel(undefined)}
          onConfirm={async () => {
            try {
              await authApi.deleteUser(del.id);
              await reload();
              toast.success("Foydalanuvchi o‘chirildi.");
            } catch (e) {
              toast.error(
                e instanceof Error ? e.message : "O‘chirish bajarilmadi.",
              );
            }
          }}
        />
      )}
    </>
  );
}
function BusinessManager() {
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
          <h1>Bizneslar</h1>
          <p>Mustaqil biznes saytlari va ularning holati.</p>
        </div>
      </div>
      <div className="toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            placeholder="Biznes qidirish…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Sayt holati"
        >
          <option value="">Barcha holatlar</option>
          <option value="true">Faol</option>
          <option value="false">Faolsiz</option>
        </select>
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Biznes</th>
              <th>Egasi</th>
              <th>Mahsulotlar</th>
              <th>Yaratilgan</th>
              <th>Holat</th>
              <th>Amallar</th>
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
                <td>{date(b.createdAt)}</td>
                <td>
                  <span className={`badge ${b.active ? "green" : "gray"}`}>
                    {b.active ? "Faol" : "Faolsiz"}
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
                      {b.active ? "To‘xtatish" : "Yoqish"}
                    </Button>
                    <Link
                      href={`/${b.slug}`}
                      target="_blank"
                      title="Saytni ko‘rish"
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
              Obunani boshqarish
            </Link>
          </p>
          <p>{b.description}</p>
          <p>
            {b.phone} · @{b.telegram}
          </p>
          <p>{b.address}</p>
          <p>
            Obuna: {db.plans.find((p) => p.id === b.planId)?.name} ·{" "}
            {date(b.expires)}
          </p>
          <Link className="btn" href={`/${b.slug}`} target="_blank">
            Public sayt
            <ArrowUpRight size={16} />
          </Link>
        </Modal>
      )}
    </>
  );
}
function Plans() {
  const { db, update, reviewPlan } = useApp();
  const [edit, setEdit] = useState<Plan | null | undefined>();
  const [del, setDel] = useState<Plan>();
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Obunalar va tariflar</h1>
          <p>Tarif imkoniyatlari va bizneslarning obuna muddatlari.</p>
        </div>
        <Button onClick={() => setEdit(null)}>
          <Plus size={17} />
          Tarif yaratish
        </Button>
      </div>
      <div className="pricing-grid">
        {db.plans.map((p) => (
          <article className="price-card" key={p.id}>
            <h3>{p.name}</h3>
            <div className="price">{money(p.price)}</div>
            <small>
              {p.duration} kun · {productCapacity(p)} mahsulot
            </small>
            <p className="preserve">{p.features}</p>
            <div className="actions">
              <Button variant="secondary small" onClick={() => setEdit(p)}>
                <Pencil size={14} />
                Tahrirlash
              </Button>
              <button
                className="icon-btn red"
                title="Tarifni o‘chirish"
                onClick={() => {
                  if (db.businesses.some((b) => b.planId === p.id)) {
                    toast.error(
                      "Bu tarifda bizneslar bor. Avval ularning tarifini almashtiring.",
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
          title="Tarif o‘chirilsinmi?"
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
      title={plan ? "Tarifni tahrirlash" : "Yangi tarif"}
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
        <Field label="Tarif nomi">
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
            label={["Narx (so‘m)", "Davomiyligi (kun)", "Mahsulot limiti"][i]}
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
          Cheksiz mahsulotlar
        </label>
        {v.limit !== null && (
          <Field label="Mahsulot limiti">
            <input
              required
              type="number"
              min="1"
              value={v.limit}
              onChange={(e) => setV({ ...v, limit: Number(e.target.value) })}
            />
          </Field>
        )}
        <Field label="Analitika (kun)">
          <select
            value={v.analyticsDays ?? 7}
            onChange={(e) =>
              setV({ ...v, analyticsDays: Number(e.target.value) })
            }
          >
            <option value={7}>7 kun</option>
            <option value={90}>90 kun</option>
          </select>
        </Field>
        <label className="check">
          <input
            type="checkbox"
            checked={!!v.csvExport}
            onChange={(e) => setV({ ...v, csvExport: e.target.checked })}
          />
          CSV eksporti
        </label>
        <Field label="Imkoniyatlar (har qatorga bittadan)">
          <textarea
            required
            rows={5}
            value={v.features}
            onChange={(e) => setV({ ...v, features: e.target.value })}
          />
        </Field>
        <Button>Saqlash</Button>
      </form>
    </Modal>
  );
}
function PlatformSettings() {
  const { db, update } = useApp();
  const [v, setV] = useState(db.platform);
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Platforma sozlamalari</h1>
          <p>Brend va umumiy aloqa ma’lumotlari.</p>
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
        <Field label="Platforma nomi">
          <input
            required
            minLength={2}
            value={v.name}
            onChange={(e) => setV({ ...v, name: e.target.value })}
          />
        </Field>
        <Field label="Logo">
          <UploadImage
            value={v.logo}
            onChange={(logo) => setV({ ...v, logo })}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            required
            value={v.email}
            onChange={(e) => setV({ ...v, email: e.target.value })}
          />
        </Field>
        <Field label="Telefon">
          <input
            type="tel"
            required
            value={v.phone}
            onChange={(e) => setV({ ...v, phone: e.target.value })}
          />
        </Field>
        <Field label="Obunalar uchun Telegram">
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
            Tugma shu akkaunt bilan suhbatni ochadi. Xabarda akkaunt ID, do‘kon,
            sayt va tarif avtomatik yoziladi.
          </small>
        </Field>
        <Field label="Tavsif">
          <textarea
            required
            value={v.description}
            onChange={(e) => setV({ ...v, description: e.target.value })}
          />
        </Field>
        <Button>Saqlash</Button>
        <Link className="text-link" href="/admin/subscriptions">
          Tarif narxlarini boshqarish
          <ArrowUpRight size={16} />
        </Link>
      </form>
    </>
  );
}
