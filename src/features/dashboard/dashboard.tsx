"use client";
import { useNow } from "../../hooks/use-now";
import { useTranslator } from "../../i18n/runtime";
import { CurrentPlan } from "../subscriptions/current-plan";
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
export function Workspace({
  admin = false,
  section = "",
}: {
  admin?: boolean;
  section?: string;
}) {
  const __t = useTranslator();
  const adminNav: [string, string, typeof Globe][] = [
    ["", __t("Umumiy ko\u2018rinish"), LayoutDashboard],
    ["users", __t("Foydalanuvchilar"), Users],
    ["businesses", __t("Bizneslar"), Store],
    ["subscriptions", __t("Obunalar va tariflar"), CreditCard],
    ["products", __t("Mahsulotlar"), Package],
    ["settings", __t("Platforma sozlamalari"), Settings],
  ];
  const { db, user, ready, error, reset, logout, t } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const business = db.businesses.find((b) => b.ownerId === user?.id);
  if (!ready) return <Loading />;
  if (error)
    return (
      <div className="center section">
        <h1>{__t("Ma\u2019lumotlarni ochib bo\u2018lmadi")}</h1>
        <p>{error}</p>
        <Button onClick={reset}>{__t("Qayta yuklash")}</Button>
      </div>
    );
  if (!user)
    return (
      <div className="guard">
        <Logo />
        <ShieldCheck size={40} />
        <h1>{__t("Kabinetga kirish")}</h1>
        <p>{__t("Davom etish uchun hisobingizga kiring.")}</p>
        <Link className="btn" href="/login">
          {__t("Kirish")}
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  if ((admin && user.role !== "admin") || (!admin && user.role === "admin"))
    return (
      <div className="guard">
        <ShieldCheck size={40} />
        <h1>{__t("Ruxsat yo\u2018q")}</h1>
        <Link
          href={user.role === "admin" ? "/admin" : "/dashboard"}
          className="btn"
        >
          {__t("O\u2018z kabinetingizga o\u2018ting")}
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
  const label = nav.find((n) => n[0] === section)?.[1] ?? __t("Sahifa");
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
            aria-label={__t("Yopish")}
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
            <strong>
              {admin ? __t("Platforma boshqaruvi") : business?.name}
            </strong>
            <small>{admin ? __t("SUPERADMIN") : __t("BIZNES KABINETI")}</small>
          </div>
        </div>
        <small className="nav-section">
          {admin ? __t("PLATFORMA") : __t("BOSHQARUV")}
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
            <span className="badge blue">{__t("PRO IMKONIYATLAR")}</span>
            <h4>{__t("Biznesingiz bilan birga o\u2018sing.")}</h4>
            <p>{__t("Ko\u2018proq mahsulot, ko\u2018proq imkoniyat.")}</p>
            <Link href="/dashboard/subscription">
              {__t("Tariflarni ko\u2018rish")}
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
                e instanceof Error
                  ? __t(e.message)
                  : __t("Hisobdan chiqib bo\u2018lmadi."),
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
              aria-label={__t("Menyu")}
            >
              <Menu size={20} />
            </button>
            <span>
              {admin ? __t("Admin") : __t("Kabinet")}
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
                {__t("Saytni ochish")}
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
                      <h1>{__t("Mening saytim")}</h1>
                      <p>
                        {__t("Mijozlaringiz saytingizni shunday ko\u2018radi.")}
                      </p>
                    </div>
                    <Link
                      className="btn"
                      href={`/${business.slug}`}
                      target="_blank"
                    >
                      {__t("Saytni ochish")}
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
                <Empty title={__t("Sahifa topilmadi")} />
              )}
            </>
          ) : (
            <Empty title={__t("Biznes topilmadi")} />
          )}
        </main>
        <footer className="workspace-footer">
          {__t("VITRIX — DEALS loyihasi")}
          <span>{__t("Biznesingizning yangi manzili.")}</span>
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
  const __t = useTranslator();
  return (
    <div className="stats-grid">
      {items.map((i) => (
        <article className="stat-card" key={__t(i.label)}>
          <div>
            <span>{__t(i.label)}</span>
            <i.icon size={18} />
          </div>
          <strong>{i.value}</strong>
          <small>{__t(i.note ?? "Joriy ma’lumotlar")}</small>
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
  const __t = useTranslator();
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
          <h3>{__t("Tashriflar dinamikasi")}</h3>
          <p className="muted">
            {__t("Oxirgi")}
            {days}
            {__t("kun")}
          </p>
        </div>
        <span className="badge blue">{__t("SAYT STATISTIKASI")}</span>
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
              name={__t("Tashriflar")}
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
  const __t = useTranslator();
  const { db, user } = useApp();
  const products = db.products.filter((p) => p.businessId === business.id);
  const events = db.events.filter((e) => e.businessId === business.id);
  const total = events.filter((e) => e.kind === "visit").length;
  return (
    <>
      <CurrentPlan business={business} />
      <div className="page-title">
        <div>
          <span className="eyebrow">{__t("BIZNESINGIZ NAZORAT OSTIDA")}</span>
          <h1>
            {__t("Salom,")}
            {user?.firstName} <span className="wave">✳</span>
          </h1>
          <p>{__t("Bugun biznesingiz uchun yana bir yaxshi kun.")}</p>
        </div>
        <Link className="btn" href="/dashboard/products">
          <Plus size={17} />
          {__t("Mahsulot qo\u2018shish")}
        </Link>
      </div>
      <div className="website-status-banner">
        <span className="status-globe">
          <Globe size={24} />
        </span>
        <div>
          <strong>
            {__t("Saytingiz")}
            {business.active ? "internetda" : "yashirilgan"}
            <span className={`badge ${business.active ? "green" : "gray"}`}>
              {business.active ? __t("Faol") : __t("Faolsiz")}
            </span>
          </strong>
          <p>
            {__t(
              "Havolangizni ulashing. Yangi mijozlarga yaqinroq bo\u2018ling.",
            )}
          </p>
        </div>
        <SiteLink slug={business.slug} />
      </div>
      <Stats
        items={[
          {
            label: __t("Umumiy tashriflar"),
            value: total,
            icon: Eye,
            note: __t("Jami sayt tashriflari"),
          },
          {
            label: __t("Bugungi tashriflar"),
            value: events.filter(
              (e) =>
                e.kind === "visit" &&
                e.at.slice(0, 10) === new Date().toISOString().slice(0, 10),
            ).length,
            icon: BarChart3,
            note: __t("Bugungi sayt tashriflari"),
          },
          {
            label: __t("Mahsulotlar"),
            value: products.length,
            icon: Package,
            note:
              products.filter((p) => p.status === "published").length +
              __t(" tasi e\u2019lon qilingan"),
          },
          {
            label: __t("Kategoriyalar"),
            value: db.categories.filter((c) => c.businessId === business.id)
              .length,
            icon: FolderOpen,
            note: __t("Katalog bo\u2018limlari"),
          },
        ]}
      />
      <div className="overview-grid">
        <TrafficChart businessId={business.id} />
        <section className="panel contact-stats">
          <h3>{__t("Mijozlar bilan aloqa")}</h3>
          <p className="muted">{__t("Aloqa tugmalariga bosilishlar")}</p>
          <div>
            <span className="contact-stat-icon">
              <Phone size={20} />
            </span>
            <span>
              {__t("Telefon")}
              <small>{__t("Qo\u2018ng\u2018iroq tugmasi")}</small>
            </span>
            <strong>{events.filter((e) => e.kind === "phone").length}</strong>
          </div>
          <div>
            <span className="contact-stat-icon telegram">
              <Send size={20} />
            </span>
            <span>
              Telegram<small>{__t("Xabar tugmasi")}</small>
            </span>
            <strong>
              {events.filter((e) => e.kind === "telegram").length}
            </strong>
          </div>
          <div className="callout">
            <span className="live-dot" />
            {__t("To\u2018g\u2018ridan-to\u2018g\u2018ri mijozingizga yaqin.")}
          </div>
        </section>
      </div>
      <div className="overview-grid">
        <section className="panel">
          <div className="between">
            <h3>{__t("So\u2018nggi faoliyat")}</h3>
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
                    <small>{date(a.at, __t.language)}</small>
                  </div>
                </div>
              ))}
          </div>
        </section>
        <section className="panel subscription-mini">
          <span className="eyebrow">{__t("SIZNING TARIFINGIZ")}</span>
          <h2>
            {__t(
              db.plans.find((p) => p.id === business.planId)?.name ??
                "Tarif topilmadi",
            )}
            <span
              className={`badge ${new Date(business.expires) > new Date() ? "blue" : "amber"}`}
            >
              {new Date(business.expires) > new Date()
                ? __t("Faol")
                : __t("Muddati tugagan")}
            </span>
          </h2>
          <p>
            {__t("Amal qilish muddati:")}
            {date(business.expires, __t.language)}
          </p>
          <div className="between">
            <span>
              {products.length} /{" "}
              {productCapacity(db.plans.find((p) => p.id === business.planId))}{" "}
              {__t("mahsulot")}
            </span>
            <Link className="text-link" href="/dashboard/subscription">
              {__t("Tarifni boshqarish")}
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
            <h3>{__t("Saytingizdan bir parcha")}</h3>
            <p className="muted">
              {business.name} · {products.length}
              {__t("mahsulot")}
            </p>
          </div>
          <Link href="/dashboard/website" className="text-link">
            {__t("To\u2018liq ko\u2018rish")}
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="overview-product-strip">
          {products.slice(0, 4).map((p) => (
            <div key={p.id}>
              <img src={p.image || "/images/burger.jpg"} alt={p.name} />
              <span>
                {p.name}
                <strong>{money(p.price, __t.language)}</strong>
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
function Analytics({ business }: { business: Business }) {
  const __t = useTranslator();
  const { db } = useApp();
  const plan = db.plans.find((p) => p.id === business.planId);
  const [days, setDays] = useState(7);
  const range = Math.min(days, analyticsDays(plan));
  const now = useNow();
  const since = now - range * 86400000;
  const e = db.events.filter(
    (e) => e.businessId === business.id && new Date(e.at).getTime() >= since,
  );
  const visits = e.filter((e) => e.kind === "visit").length;
  const clicks = e.filter((e) => e.kind !== "visit").length;
  return (
    <>
      <div className="page-title">
        <div>
          <h1>{__t("Analitika")}</h1>
          <p>
            {__t("Oxirgi")}
            {range}
            {__t("kun \u00B7 saytingizda qayd etilgan hodisalar.")}
          </p>
        </div>
        <div className="actions">
          <select
            aria-label={__t("Statistika davri")}
            value={range}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {[7, 30, 90]
              .filter((n) => n <= analyticsDays(plan))
              .map((n) => (
                <option key={n} value={n}>
                  {n}
                  {__t("kun")}
                </option>
              ))}
          </select>
          {plan?.csvExport ? (
            <Button
              variant="secondary"
              onClick={() => {
                const csv =
                  __t("Hodisa,Sana\n") +
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
              {__t("CSV yuklash")}
              <ArrowUpRight size={16} />
            </Button>
          ) : (
            <Link
              className="btn secondary small"
              href="/dashboard/subscription"
            >
              {__t("VIP: 90 kun va CSV")}
              <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
      </div>
      <Stats
        items={[
          { label: __t("Tashriflar"), value: visits, icon: Eye },
          {
            label: __t("Telefon"),
            value: e.filter((e) => e.kind === "phone").length,
            icon: Phone,
          },
          {
            label: "Telegram",
            value: e.filter((e) => e.kind === "telegram").length,
            icon: Send,
          },
          {
            label: __t("Aloqa / tashrif"),
            value: (visits ? Math.round((clicks / visits) * 100) : 0) + "%",
            icon: BarChart3,
            note: __t("Bosilishlar / tashriflar"),
          },
        ]}
      />
      <TrafficChart businessId={business.id} days={range} />
    </>
  );
}
function Profile() {
  const __t = useTranslator();
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
          <h1>{__t("Profil")}</h1>
          <AccountId id={user!.accountId || user!.id} />
          <p>{__t("Shaxsiy ma\u2019lumotlaringizni yangilang.")}</p>
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
            toast.success(__t("Profil saqlandi."));
          } catch (e) {
            toast.error(
              e instanceof Error
                ? __t(e.message)
                : __t("Saqlab bo\u2018lmadi."),
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {(["firstName", "lastName", "phone"] as const).map((key, i) => (
          <Field
            key={key}
            label={[__t("Ism"), __t("Familiya"), __t("Telefon")][i]}
          >
            <input
              required
              value={v[key]}
              onChange={(e) => setV({ ...v, [key]: e.target.value })}
            />
          </Field>
        ))}
        <Field label={__t("Tasdiqlangan email")}>
          <input value={user?.email} readOnly />
        </Field>
        <Button disabled={busy}>
          {busy ? "Saqlanmoqda…" : __t("Saqlash")}
        </Button>
        <Link className="text-link" href="/forgot-password">
          {__t("Parolni email kodi orqali yangilash")}
        </Link>
      </form>
    </>
  );
}
