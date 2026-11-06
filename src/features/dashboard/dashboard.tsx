"use client";
import { AccountId } from "../../components/ui/account-id";
import { SubscriptionPage } from "../subscriptions/subscription-page";
import { useState } from "react";
import { authApi } from "../../services/auth";
import {
  productCapacity,
  analyticsDays,
  activatePlan,
} from "../../services/plans";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Package,
  FolderOpen,
  Palette,
  Phone,
  Settings,
  BarChart3,
  CreditCard,
  User,
  LogOut,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Send,
  Eye,
  Menu,
  X,
  Check,
  ChevronRight,
  Store,
  Users,
  ShieldCheck,
  Search,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useApp } from "../../stores/app-store";
import {
  Logo,
  Preferences,
  Button,
  SiteLink,
  Loading,
  Field,
  Empty,
} from "../../components/ui/shared";
import type { Business } from "../../types";
import { ProductManager } from "../products/product-manager";
import { CategoryManager } from "../categories/category-manager";
import { BusinessSettings, DesignSettings } from "../businesses/settings";
import { BusinessSite } from "../../components/public-website/business-site";
import { AdminPage } from "../admin/admin";
import { date, money } from "../../lib/utils";
import type { TranslationKey } from "../../i18n";
import { toast } from "sonner";
const ownerNav: [string, TranslationKey, typeof Globe][] = [
  ["", "overview", LayoutDashboard],
  ["website", "website", Globe],
  ["products", "products", Package],
  ["categories", "categories", FolderOpen],
  ["design", "design", Palette],
  ["contacts", "contacts", Phone],
  ["settings", "settings", Settings],
  ["analytics", "analytics", BarChart3],
  ["subscription", "subscription", CreditCard],
  ["profile", "profile", User],
];
const adminNav: [string, string, typeof Globe][] = [
  ["", "Umumiy ko‘rinish", LayoutDashboard],
  ["users", "Foydalanuvchilar", Users],
  ["businesses", "Bizneslar", Store],
  ["subscriptions", "Obunalar va tariflar", CreditCard],
  ["products", "Mahsulotlar", Package],
  ["settings", "Platforma sozlamalari", Settings],
];
export function Workspace({
  admin = false,
  section = "",
}: {
  admin?: boolean;
  section?: string;
}) {
  const { db, user, ready, error, reset, logout, t } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const business = db.businesses.find((b) => b.ownerId === user?.id);
  if (!ready) return <Loading />;
  if (error)
    return (
      <div className="center section">
        <h1>Ma’lumotlarni ochib bo‘lmadi</h1>
        <p>{error}</p>
        <Button onClick={reset}>Qayta yuklash</Button>
      </div>
    );
  if (!user)
    return (
      <div className="guard">
        <Logo />
        <ShieldCheck size={40} />
        <h1>Kabinetga kirish</h1>
        <p>Davom etish uchun hisobingizga kiring.</p>
        <Link className="btn" href="/login">
          Kirish
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  if ((admin && user.role !== "admin") || (!admin && user.role === "admin"))
    return (
      <div className="guard">
        <ShieldCheck size={40} />
        <h1>Ruxsat yo‘q</h1>
        <Link
          href={user.role === "admin" ? "/admin" : "/dashboard"}
          className="btn"
        >
          O‘z kabinetingizga o‘ting
        </Link>
      </div>
    );
  const base = admin ? "/admin" : "/dashboard";
  const nav = admin
    ? adminNav
    : ownerNav.map(
        ([url, key, icon]) =>
          [url, t(key), icon] as [string, string, typeof Globe],
      );
  const label = nav.find((n) => n[0] === section)?.[1] ?? "Sahifa";
  return (
    <div className="workspace">
      <div
        className={`sidebar-backdrop ${open ? "show" : ""}`}
        onClick={() => setOpen(false)}
      />
      <aside className={`sidebar ${open ? "show" : ""}`}>
        <div className="sidebar-logo">
          <Logo />
          <button
            className="icon-btn mobile-menu"
            aria-label="Yopish"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="workspace-switch">
          <span className="workspace-avatar">
            {admin ? <ShieldCheck size={22} /> : business?.name.slice(0, 1)}
          </span>
          <div>
            <strong>{admin ? "Platforma boshqaruvi" : business?.name}</strong>
            <small>{admin ? "SUPERADMIN" : "BIZNES KABINETI"}</small>
          </div>
        </div>
        <small className="nav-section">
          {admin ? "PLATFORMA" : "BOSHQARUV"}
        </small>
        <nav>
          {nav.map(([url, label, Icon]) => (
            <Link
              key={url}
              href={`${base}${url ? "/" + url : ""}`}
              className={section === url ? "active" : ""}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              {label}
              {section === url && <span />}
            </Link>
          ))}
        </nav>
        {!admin && (
          <div className="sidebar-upgrade">
            <span className="badge blue">PRO IMKONIYATLAR</span>
            <h4>Biznesingiz bilan birga o‘sing.</h4>
            <p>Ko‘proq mahsulot, ko‘proq imkoniyat.</p>
            <Link href="/dashboard/subscription">
              Tariflarni ko‘rish
              <ArrowUpRight size={15} />
            </Link>
          </div>
        )}
        <button
          className="logout"
          onClick={async () => {
            try {
              await logout();
              router.push("/login");
            } catch (e) {
              toast.error(
                e instanceof Error ? e.message : "Hisobdan chiqib bo‘lmadi.",
              );
            }
          }}
        >
          <LogOut size={17} />
          {t("logout")}
        </button>
        <div className="sidebar-user">
          <span>
            {user.firstName[0]}
            {user.lastName[0]}
          </span>
          <div>
            <strong>
              {user.firstName} {user.lastName}
            </strong>
            <AccountId id={user.accountId || user.id} />
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-header">
          <div className="actions">
            <button
              className="icon-btn mobile-menu"
              onClick={() => setOpen(true)}
              aria-label="Menyu"
            >
              <Menu size={20} />
            </button>
            <span>
              {admin ? "Admin" : "Kabinet"}
              <ChevronRight size={13} />
              <b>{label}</b>
            </span>
          </div>
          <div className="actions">
            <Preferences />
            {!admin && business && (
              <Link
                href={`/${business.slug}`}
                target="_blank"
                className="btn secondary small"
              >
                Saytni ochish
                <ArrowUpRight size={15} />
              </Link>
            )}
            <span className="avatar">{user.firstName[0]}</span>
          </div>
        </header>
        <main className="workspace-content">
          {admin ? (
            <AdminPage section={section} />
          ) : business ? (
            <>
              {section === "" ? (
                <Overview business={business} />
              ) : section === "products" ? (
                <ProductManager businessId={business.id} />
              ) : section === "categories" ? (
                <CategoryManager businessId={business.id} />
              ) : section === "design" ? (
                <DesignSettings key={business.id} business={business} />
              ) : section === "settings" || section === "contacts" ? (
                <BusinessSettings
                  key={section}
                  business={business}
                  contacts={section === "contacts"}
                />
              ) : section === "analytics" ? (
                <Analytics business={business} />
              ) : section === "website" ? (
                <>
                  <div className="page-title">
                    <div>
                      <h1>Mening saytim</h1>
                      <p>Mijozlaringiz saytingizni shunday ko‘radi.</p>
                    </div>
                    <Link
                      className="btn"
                      href={`/${business.slug}`}
                      target="_blank"
                    >
                      Saytni ochish
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                  <SiteLink slug={business.slug} />
                  <div className="website-preview-full">
                    <BusinessSite business={business} preview />
                  </div>
                </>
              ) : section === "subscription" ? (
                <SubscriptionPage business={business} />
              ) : section === "profile" ? (
                <Profile />
              ) : (
                <Empty title="Sahifa topilmadi" />
              )}
            </>
          ) : (
            <Empty title="Biznes topilmadi" />
          )}
        </main>
        <footer className="workspace-footer">
          © 2026 VITRIX <span>Biznesingizning yangi manzili.</span>
        </footer>
      </div>
    </div>
  );
}
export function Stats({
  items,
}: {
  items: {
    label: string;
    value: string | number;
    icon: typeof Eye;
    note?: string;
  }[];
}) {
  return (
    <div className="stats-grid">
      {items.map((i) => (
        <article className="stat-card" key={i.label}>
          <div>
            <span>{i.label}</span>
            <i.icon size={18} />
          </div>
          <strong>{i.value}</strong>
          <small>{i.note ?? "Joriy ma’lumotlar"}</small>
        </article>
      ))}
    </div>
  );
}
export function TrafficChart({
  businessId,
  days = 7,
}: {
  businessId: string;
  days?: number;
}) {
  const { db } = useApp();
  const chart = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - days + 1 + i);
    const key = d.toISOString().slice(0, 10);
    return {
      day: d.toLocaleDateString("uz-UZ", { weekday: "short" }),
      visits: db.events.filter(
        (e) =>
          e.businessId === businessId &&
          e.kind === "visit" &&
          e.at.startsWith(key),
      ).length,
    };
  });
  return (
    <div className="panel traffic-panel">
      <div className="between">
        <div>
          <h3>Tashriflar dinamikasi</h3>
          <p className="muted">Oxirgi {days} kun</p>
        </div>
        <span className="badge blue">SAYT STATISTIKASI</span>
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chart}
            margin={{ top: 15, right: 10, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#315bea" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#315bea" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="var(--border)"
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#8a90a0" }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#8a90a0" }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--panel)",
                borderColor: "var(--border)",
                borderRadius: 10,
              }}
            />
            <Area
              type="monotone"
              dataKey="visits"
              name="Tashriflar"
              stroke="#315bea"
              strokeWidth={2.5}
              fill="url(#area)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
function Overview({ business }: { business: Business }) {
  const { db, user } = useApp();
  const products = db.products.filter((p) => p.businessId === business.id);
  const events = db.events.filter((e) => e.businessId === business.id);
  const total = events.filter((e) => e.kind === "visit").length;
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">BIZNESINGIZ NAZORAT OSTIDA</span>
          <h1>
            Salom, {user?.firstName} <span className="wave">✳</span>
          </h1>
          <p>Bugun biznesingiz uchun yana bir yaxshi kun.</p>
        </div>
        <Link className="btn" href="/dashboard/products">
          <Plus size={17} />
          Mahsulot qo‘shish
        </Link>
      </div>
      <div className="website-status-banner">
        <span className="status-globe">
          <Globe size={24} />
        </span>
        <div>
          <strong>
            Saytingiz {business.active ? "internetda" : "yashirilgan"}
            <span className={`badge ${business.active ? "green" : "gray"}`}>
              {business.active ? "Faol" : "Faolsiz"}
            </span>
          </strong>
          <p>Havolangizni ulashing. Yangi mijozlarga yaqinroq bo‘ling.</p>
        </div>
        <SiteLink slug={business.slug} />
      </div>
      <Stats
        items={[
          {
            label: "Umumiy tashriflar",
            value: total,
            icon: Eye,
            note: "Jami sayt tashriflari",
          },
          {
            label: "Bugungi tashriflar",
            value: events.filter(
              (e) =>
                e.kind === "visit" &&
                e.at.slice(0, 10) === new Date().toISOString().slice(0, 10),
            ).length,
            icon: BarChart3,
            note: "Bugungi sayt tashriflari",
          },
          {
            label: "Mahsulotlar",
            value: products.length,
            icon: Package,
            note:
              products.filter((p) => p.status === "published").length +
              " tasi e’lon qilingan",
          },
          {
            label: "Kategoriyalar",
            value: db.categories.filter((c) => c.businessId === business.id)
              .length,
            icon: FolderOpen,
            note: "Katalog bo‘limlari",
          },
        ]}
      />
      <div className="overview-grid">
        <TrafficChart businessId={business.id} />
        <section className="panel contact-stats">
          <h3>Mijozlar bilan aloqa</h3>
          <p className="muted">Aloqa tugmalariga bosilishlar</p>
          <div>
            <span className="contact-stat-icon">
              <Phone size={20} />
            </span>
            <span>
              Telefon<small>Qo‘ng‘iroq tugmasi</small>
            </span>
            <strong>{events.filter((e) => e.kind === "phone").length}</strong>
          </div>
          <div>
            <span className="contact-stat-icon telegram">
              <Send size={20} />
            </span>
            <span>
              Telegram<small>Xabar tugmasi</small>
            </span>
            <strong>
              {events.filter((e) => e.kind === "telegram").length}
            </strong>
          </div>
          <div className="callout">
            <span className="live-dot" /> To‘g‘ridan-to‘g‘ri mijozingizga yaqin.
          </div>
        </section>
      </div>
      <div className="overview-grid">
        <section className="panel">
          <div className="between">
            <h3>So‘nggi faoliyat</h3>
            <Activity size={18} />
          </div>
          <div className="activity-list">
            {db.activities
              .filter((a) => a.businessId === business.id)
              .slice(0, 5)
              .map((a) => (
                <div key={a.id}>
                  <span>
                    <Check size={14} />
                  </span>
                  <div>
                    <strong>{a.text}</strong>
                    <small>{date(a.at)}</small>
                  </div>
                </div>
              ))}
          </div>
        </section>
        <section className="panel subscription-mini">
          <span className="eyebrow">SIZNING TARIFINGIZ</span>
          <h2>
            {db.plans.find((p) => p.id === business.planId)?.name ??
              "Tarif topilmadi"}
            <span
              className={`badge ${new Date(business.expires) > new Date() ? "blue" : "amber"}`}
            >
              {new Date(business.expires) > new Date()
                ? "Faol"
                : "Muddati tugagan"}
            </span>
          </h2>
          <p>Amal qilish muddati: {date(business.expires)}</p>
          <div className="between">
            <span>
              {products.length} /{" "}
              {productCapacity(db.plans.find((p) => p.id === business.planId))}{" "}
              mahsulot
            </span>
            <Link className="text-link" href="/dashboard/subscription">
              Tarifni boshqarish
              <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="progress-track">
            <span
              style={{
                width:
                  Math.min(
                    100,
                    (products.length /
                      (db.plans.find((p) => p.id === business.planId)?.limit ??
                        Infinity)) *
                      100,
                  ) + "%",
              }}
            />
          </div>
        </section>
      </div>
      <section className="panel overview-preview">
        <div className="between">
          <div>
            <h3>Saytingizdan bir parcha</h3>
            <p className="muted">
              {business.name} · {products.length} mahsulot
            </p>
          </div>
          <Link href="/dashboard/website" className="text-link">
            To‘liq ko‘rish
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="overview-product-strip">
          {products.slice(0, 4).map((p) => (
            <div key={p.id}>
              <img src={p.image || "/images/burger.jpg"} alt={p.name} />
              <span>
                {p.name}
                <strong>{money(p.price)}</strong>
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
function Analytics({ business }: { business: Business }) {
  const { db } = useApp();
  const plan = db.plans.find((p) => p.id === business.planId);
  const [days, setDays] = useState(7);
  const range = Math.min(days, analyticsDays(plan));
  const since = Date.now() - range * 86400000;
  const e = db.events.filter(
    (e) => e.businessId === business.id && new Date(e.at).getTime() >= since,
  );
  const visits = e.filter((e) => e.kind === "visit").length;
  const clicks = e.filter((e) => e.kind !== "visit").length;
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Analitika</h1>
          <p>Oxirgi {range} kun · saytingizda qayd etilgan hodisalar.</p>
        </div>
        <div className="actions">
          <select
            aria-label="Statistika davri"
            value={range}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {[7, 30, 90]
              .filter((n) => n <= analyticsDays(plan))
              .map((n) => (
                <option key={n} value={n}>
                  {n} kun
                </option>
              ))}
          </select>
          {plan?.csvExport ? (
            <Button
              variant="secondary"
              onClick={() => {
                const csv =
                  "Hodisa,Sana\n" +
                  e.map((v) => `${v.kind},${v.at}`).join("\n");
                const a = document.createElement("a");
                a.href = URL.createObjectURL(
                  new Blob([csv], { type: "text/csv" }),
                );
                a.download = "vitrix-analytics.csv";
                a.click();
                URL.revokeObjectURL(a.href);
              }}
            >
              CSV yuklash
              <ArrowUpRight size={16} />
            </Button>
          ) : (
            <Link
              className="btn secondary small"
              href="/dashboard/subscription"
            >
              VIP: 90 kun va CSV
              <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
      </div>
      <Stats
        items={[
          { label: "Tashriflar", value: visits, icon: Eye },
          {
            label: "Telefon",
            value: e.filter((e) => e.kind === "phone").length,
            icon: Phone,
          },
          {
            label: "Telegram",
            value: e.filter((e) => e.kind === "telegram").length,
            icon: Send,
          },
          {
            label: "Aloqa / tashrif",
            value: (visits ? Math.round((clicks / visits) * 100) : 0) + "%",
            icon: BarChart3,
            note: "Bosilishlar / tashriflar",
          },
        ]}
      />
      <TrafficChart businessId={business.id} days={range} />
    </>
  );
}
function Profile() {
  const { user, acceptUser } = useApp();
  const [v, setV] = useState({
    firstName: user!.firstName,
    lastName: user!.lastName,
    phone: user!.phone,
  });
  const [busy, setBusy] = useState(false);
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Profil</h1>
          <AccountId id={user!.accountId || user!.id} />
          <p>Shaxsiy ma’lumotlaringizni yangilang.</p>
        </div>
      </div>
      <form
        className="panel narrow"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const result = await authApi.profile(v);
            await acceptUser(result.user);
            toast.success("Profil saqlandi.");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Saqlab bo‘lmadi.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {(["firstName", "lastName", "phone"] as const).map((key, i) => (
          <Field key={key} label={["Ism", "Familiya", "Telefon"][i]}>
            <input
              required
              value={v[key]}
              onChange={(e) => setV({ ...v, [key]: e.target.value })}
            />
          </Field>
        ))}
        <Field label="Tasdiqlangan email">
          <input value={user?.email} readOnly />
        </Field>
        <Button disabled={busy}>{busy ? "Saqlanmoqda…" : "Saqlash"}</Button>
        <Link className="text-link" href="/forgot-password">
          Parolni email kodi orqali yangilash
        </Link>
      </form>
    </>
  );
}
