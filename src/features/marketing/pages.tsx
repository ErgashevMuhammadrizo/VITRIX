"use client";
import { useTranslator } from "../../i18n/runtime";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Globe,
  Palette,
  BarChart3,
  Smartphone,
  ShieldCheck,
  Zap,
  Package,
  MousePointer2,
  Plus,
  ExternalLink,
  Store,
  Utensils,
  Cake,
  Flower2,
  ShoppingBag,
  Send,
  Phone,
  Mail,
} from "lucide-react";
import { Navbar, Footer, CTA } from "../../components/layout/marketing";
import { useApp } from "../../stores/app-store";
import { money } from "../../lib/utils";
import { Button, Field } from "../../components/ui/shared";
export function Pricing() {
  const __t = useTranslator();
  const { db, user } = useApp();
  if (!user)
    return (
      <div className="panel center">
        <h2>{__t("Tariflarni kabinetda ko\u2018ring")}</h2>
        <p>{__t("Ro\u2018yxatdan o\u2018ting yoki hisobingizga kiring.")}</p>
        <Link href="/register" className="btn">
          {__t("Ro\u2018yxatdan o\u2018tish")}
        </Link>
        <Link href="/login" className="text-link">
          {__t("Kirish")}
        </Link>
      </div>
    );
  return (
    <div className="pricing-grid">
      {db.plans.map((plan, i) => (
        <article
          className={`price-card ${i === 1 ? "recommended" : ""}`}
          key={plan.id}
        >
          {i === 1 && (
            <span className="recommended-label">{__t("TAVSIYA ETAMIZ")}</span>
          )}
          <h3>{plan.name}</h3>
          <p>
            {i === 0
              ? __t("Birinchi qadamingiz uchun")
              : i === 1
                ? __t("O\u2018sayotgan biznesingiz uchun")
                : __t("Hisobot va tahlilni qadrlaydiganlar uchun")}
          </p>
          <div className="price">
            {plan.price ? money(plan.price, __t.language) : __t("Bepul")}
            <small>
              {plan.price > 0 ? __t(" / oy") : __t(" / birinchi 1 oy")}
            </small>
          </div>
          <Link
            href={`/register?plan=${plan.id}`}
            className={`btn ${i !== 1 ? "secondary" : ""}`}
          >
            {i === 0 ? __t("1 oy bepul boshlash") : __t("Tarifni tanlash")}
            <ArrowUpRight size={17} />
          </Link>
          <ul>
            {plan.features.split("\n").map((f) => (
              <li key={__t(f)}>
                <Check size={16} />
                {__t(f)}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
function DemoPreview() {
  const __t = useTranslator();
  return (
    <div className="hero-visual">
      <div className="browser-card">
        <div className="browser-top">
          <span className="dots">● ● ●</span>
          <span>
            <ShieldCheck size={11} />
            vitrix.uz/burger-house
          </span>
          <ExternalLink size={12} />
        </div>
        <div className="preview-nav">
          <b>
            <span className="mini-burger">B.</span> Burger House
          </b>
          <span>
            {__t("Menyu")}
            <i>{__t("Biznes haqida")}</i>
          </span>
          <Link href="/demo">{__t("Bog‘lanish")} ↗</Link>
        </div>
        <div className="preview-hero">
          <div>
            <span className="tiny-label">
              {__t("YANGI. MAZALI. SIZ UCHUN.")}
            </span>
            <h3>
              {__t("Haqiqiy ta\u2019m.")}
              <br />
              {__t("Har bir luqmada.")}
            </h3>
            <p>
              {__t("Yangi masalliqlar va mehr bilan")}
              <br />
              {__t("tayyorlangan sevimli burgerlaringiz.")}
            </p>
            <Link href="/demo">
              {__t("Menyuni ko\u2018rish")}
              <ArrowRight size={12} />
            </Link>
          </div>
          <img src="/images/burger.jpg" alt={__t("Burger House burgeri")} />
        </div>
        <div className="preview-products">
          <b>{__t("Sevimlingizni tanlang")}</b>
          <div>
            {[
              ["burger", "Classic Burger", "35 000"],
              ["double", "Double Cheese", "48 000"],
              ["fries", "French Fries", "16 000"],
            ].map(([im, n, p]) => (
              <Link href="/demo" className="mini-product" key={n}>
                <img src={`/images/${im}.jpg`} alt={__t(n)} />
                <strong>{__t(n)}</strong>
                <small>
                  {p} {__t("so\u2018m")}
                </small>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="float-stat">
        <span className="stat-icon">
          <BarChart3 size={18} />
        </span>
        <div>
          <small>{__t("Saytingiz doimo ochiq")}</small>
          <strong>
            24/7 <span>{__t("onlayn")}</span>
          </strong>
        </div>
        <svg width="54" height="30" viewBox="0 0 54 30">
          <path
            d="M0 26L10 21L19 24L29 12L37 17L54 2"
            stroke="#2fa77b"
            fill="none"
            strokeWidth="2"
          />
        </svg>
      </div>
      <div className="float-live">
        <span className="live-dot" />
        {__t("Saytingiz tayyor!")}
        <Check size={13} />
      </div>
      <div className="cursor-note">
        <MousePointer2 size={20} fill="#315beb" />
        {__t("Sizning biznesingiz")}
      </div>
    </div>
  );
}
export function MarketingPage({ page = "" }: { page?: string }) {
  const __t = useTranslator();
  const capabilities = [
    {
      icon: Globe,
      title: __t("O\u2018z saytingiz. O\u2018z manzilingiz."),
      text: __t(
        "Har bir biznes uchun mustaqil sahifa. Faqat sizning brendingiz va mahsulotlaringiz.",
      ),
    },
    {
      icon: Palette,
      title: __t("Dizayn \u2014 didingizga mos"),
      text: __t(
        "Uchta tayyor uslub, brend ranglari va rasmlaringiz bilan saytingizga o\u2018ziga xoslik bering.",
      ),
    },
    {
      icon: Smartphone,
      title: __t("Har bir ekranda mukammal"),
      text: __t(
        "Telefon, planshet yoki kompyuter \u2014 mijozlaringizga hamisha qulay.",
      ),
    },
    {
      icon: Package,
      title: __t("Katalogni oson boshqaring"),
      text: __t(
        "Mahsulotlar, narxlar va kategoriyalarni bir joydan yangilang.",
      ),
    },
    {
      icon: Send,
      title: __t("Mijoz bilan bevosita aloqa"),
      text: __t(
        "Mijozlar sizga telefon yoki Telegram orqali to\u2018g\u2018ridan-to\u2018g\u2018ri murojaat qiladi.",
      ),
    },
    {
      icon: BarChart3,
      title: __t("Natijani kuzatib boring"),
      text: __t(
        "Saytga tashriflar va aloqa tugmalariga bosilishlarni kuzating.",
      ),
    },
  ];
  const { t, db, language } = useApp();
  const [sent, setSent] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", message: "" });
  const heroTitle =
    language === "ru" ? (
      <>
        Профессиональный сайт
        <br />
        для вашего бизнеса.
        <br />
        <em>Без программиста.</em>
      </>
    ) : language === "en" ? (
      <>
        Your business.
        <br />A professional website.
        <br />
        <em>No coding needed.</em>
      </>
    ) : (
      <>
        {__t("Biznesingiz uchun sayt.")}
        <br />
        {__t("Professional.")}
        <br />
        <em>{__t("Dasturchisiz.")}</em>
      </>
    );
  return (
    <>
      <Navbar />
      {page === "" ? (
        <>
          <main>
            <section className="hero container">
              <div className="hero-copy">
                <span className="pill">
                  <span className="live-dot" />
                  {__t("KATTA IMKONIYATLAR. ODDIY BOSHLANISH.")}
                </span>
                <h1>{heroTitle}</h1>
                <p>
                  {__t(
                    "Bir necha daqiqada o\u2018z biznes saytingizni yarating.",
                  )}
                  <br className="desktop" />
                  {__t("Mahsulotlaringizni joylang va mijozlaringizga")}
                  <br className="desktop" />
                  {__t("bitta havola bilan ulashing.")}
                </p>
                <div className="hero-actions">
                  <Link href="/register" className="btn">
                    {t("create")}
                    <ArrowUpRight size={18} />
                  </Link>
                  <Link href="/demo" className="btn secondary">
                    {t("demo")}
                    <ArrowRight size={17} />
                  </Link>
                </div>
                <div className="hero-checks">
                  <span>
                    <Check size={14} />
                    {__t("Bepul boshlang")}
                  </span>
                  <span>
                    <Check size={14} />
                    {__t("Karta talab qilinmaydi")}
                  </span>
                  <span>
                    <Check size={14} />
                    {__t("Bir necha daqiqada")}
                  </span>
                </div>
              </div>
              <DemoPreview />
            </section>
            <div className="business-types container">
              <span>{__t("HAR QANDAY BIZNES UCHUN")}</span>
              {[
                [Utensils, __t("Kafe va restoran")],
                [ShoppingBag, __t("Do\u2018kon va butik")],
                [Cake, __t("Qandolatchilik")],
                [Flower2, __t("Gul do\u2018konlari")],
              ].map(([Icon, label]) => {
                const I = Icon as typeof Store;
                return (
                  <div key={String(label)}>
                    <I size={19} />
                    {String(label)}
                  </div>
                );
              })}
              <span className="more-types">
                {__t("va yana ko\u2018plab bizneslar \u2197")}
              </span>
            </div>
            <section className="section container">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">
                    {__t("MURAKKABLIK ORTDA QOLSIN")}
                  </span>
                  <h2>
                    {__t("G\u2018oyangizdan saytingizgacha.")}
                    <br />
                    {__t("Atigi uchta qadam.")}
                  </h2>
                </div>
                <p>
                  {__t("Texnik bilim shart emas.")}
                  <br />
                  {__t("Biznesingizni sizdan yaxshi kim biladi?")}
                </p>
              </div>
              <div className="steps">
                {[
                  [
                    "01",
                    __t("Biznesingizni tanishtiring"),
                    __t("Nom, logo va aloqa ma\u2019lumotlarini kiriting."),
                    Store,
                  ],
                  [
                    "02",
                    __t("Katalogingizni yarating"),
                    __t(
                      "Rasm, narx va tavsif bilan mahsulotlarni qo\u2018shing.",
                    ),
                    Package,
                  ],
                  [
                    "03",
                    __t("Havolangizni ulashing"),
                    __t("Tayyor saytingizni Instagram va Telegramga joylang."),
                    ArrowUpRight,
                  ],
                ].map(([n, title, text, I]) => {
                  const Icon = I as typeof Store;
                  return (
                    <article key={String(n)}>
                      <span className="step-number">{String(n)}</span>
                      <Icon size={26} />
                      <h3>{String(title)}</h3>
                      <p>{String(text)}</p>
                    </article>
                  );
                })}
              </div>
            </section>
            <section className="features-band">
              <div className="container section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">{__t("BARCHASI BIR JOYDA")}</span>
                    <h2>
                      {__t("Kichik biznes uchun.")}
                      <br />
                      {__t("Katta imkoniyatlar bilan.")}
                    </h2>
                  </div>
                  <Link href="/features" className="text-link">
                    {__t("Barcha imkoniyatlar")}
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
                <div className="feature-grid">
                  {capabilities.map((c) => (
                    <article key={c.title}>
                      <div className="feature-icon">
                        <c.icon size={23} />
                      </div>
                      <h3>{c.title}</h3>
                      <p>{c.text}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
            <section className="faq-section container">
              <div>
                <span className="eyebrow">{__t("SAVOLLARINGIZ BORMI?")}</span>
                <h2>
                  {__t("Javoblar")}
                  <br />
                  {__t("shu yerda.")}
                </h2>
                <Link href="/contact" className="text-link">
                  {__t("Biz bilan bog\u2018laning")}
                  <ArrowUpRight size={18} />
                </Link>
              </div>
              <div className="faqs">
                {[
                  [
                    __t("Sayt yaratish uchun dasturlashni bilishim kerakmi?"),
                    __t(
                      "Yo\u2018q. Ma\u2019lumotlarni kiriting, mahsulot qo\u2018shing va tayyor dizayndan birini tanlang.",
                    ),
                  ],
                  [
                    __t("Mijozlarim ro\u2018yxatdan o\u2018tishi kerakmi?"),
                    __t(
                      "Yo\u2018q. Saytingiz havolasi mijozlarga to\u2018g\u2018ridan-to\u2018g\u2018ri katalogingizni ochadi.",
                    ),
                  ],
                  [
                    __t("Buyurtmalarni qanday qabul qilaman?"),
                    __t(
                      "Mijozlaringiz telefon yoki Telegram tugmasi orqali siz bilan bog\u2018lanadi. Savatcha va to\u2018lov tizimi qo\u2018shilmagan.",
                    ),
                  ],
                  [
                    __t("Ma\u2019lumotlar qayerda saqlanadi?"),
                    __t(
                      "Hisob va katalog ma\u2019lumotlari serverda saqlanadi. Saytingizni boshqa qurilmadan ham ochish mumkin.",
                    ),
                  ],
                ].map(([q, a]) => (
                  <details key={q}>
                    <summary>
                      {q}
                      <Plus size={18} />
                    </summary>
                    <p>{a}</p>
                  </details>
                ))}
              </div>
            </section>
            <CTA />
          </main>
        </>
      ) : page === "pricing" ? (
        <main className="container section">
          <div className="section-heading centered">
            <span className="eyebrow">{__t("TARIFLAR")}</span>
            <h1>{__t("Biznesingizga mos reja.")}</h1>
            <p>{__t("Barcha tariflarda mustaqil sayt va mobil dizayn.")}</p>
          </div>
          <Pricing />
          <p className="muted center">
            {__t(
              "Tariflar oylik. Obuna administrator to\u2018lovni tasdiqlagach faollashadi.",
            )}
          </p>
        </main>
      ) : page === "features" ? (
        <>
          <main className="section container">
            <div className="section-heading centered">
              <span className="eyebrow">{__t("IMKONIYATLAR")}</span>
              <h1>
                {__t("Boshqarish oson.")}
                <br />
                {__t("Natijasi professional.")}
              </h1>
            </div>
            <div className="feature-grid">
              {capabilities.map((c) => (
                <article key={c.title}>
                  <c.icon />
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                </article>
              ))}
            </div>
          </main>
          <CTA />
        </>
      ) : page === "about" ? (
        <main className="container prose section">
          <span className="eyebrow">{__t("BIZ HAQIMIZDA")}</span>
          <h1>
            {__t("Har bir biznesning")}
            <br />
            {__t("o\u2018z manzili bo\u2018lsin.")}
          </h1>
          <p className="lead">
            {__t(
              "VITRIX \u2014 kichik va o\u2018rta bizneslar o\u2018z mahsulotlarini internetda sodda va chiroyli namoyish etishi uchun yaratilgan platforma.",
            )}
          </p>
          <p>
            {__t(
              "Biznes egasi uchun eng muhim ish \u2014 mijozlariga xizmat ko\u2018rsatish. Biz saytni boshqarishni qulay qilamiz: mahsulotlar, dizayn va aloqa ma\u2019lumotlari bir kabinetda.",
            )}
          </p>
          <div className="callout">
            <Globe />
            <h3>{__t("Mustaqil sahifa, bevosita aloqa.")}</h3>
            <p>
              {__t(
                "Har bir biznes o\u2018z katalogiga ega. Mijozlar telefon va Telegram orqali bevosita sizga murojaat qiladi.",
              )}
            </p>
          </div>
          <Link className="btn" href="/register">
            {__t("Boshlash")}
            <ArrowRight size={18} />
          </Link>
        </main>
      ) : page === "contact" ? (
        <main className="container section contact-grid">
          <div>
            <span className="eyebrow">{__t("BOG\u2018LANISH")}</span>
            <h1>
              {__t("Birgalikda")}
              <br />
              {__t("boshlaymiz.")}
            </h1>
            <p>{__t("Savollaringiz va takliflaringiz uchun ochiqmiz.")}</p>
            <a href={`mailto:${db.platform.email}`} className="contact-line">
              <Mail />
              {db.platform.email}
            </a>
            <a href={`tel:${db.platform.phone}`} className="contact-line">
              <Phone />
              {db.platform.phone}
            </a>
            <small className="muted">
              {__t(
                "Aloqa ma\u2019lumotlarini platforma administratori yangilaydi.",
              )}
            </small>
          </div>
          <form
            className="panel"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            {sent ? (
              <>
                <Check size={32} />
                <h2>{__t("Xabaringiz tayyor")}</h2>
                <p>
                  {__t(
                    "Xabaringizni email ilovangiz orqali jo\u2018natish uchun quyidagi havoladan foydalaning.",
                  )}
                </p>
                <a
                  className="btn"
                  href={`mailto:${db.platform.email}?subject=${encodeURIComponent(__t("VITRIX: ") + draft.name)}&body=${encodeURIComponent(__t(draft.message) + "\n\n" + draft.name + "\n" + draft.email)}`}
                >
                  {__t("Email ochish")}
                  <ArrowUpRight size={16} />
                </a>
              </>
            ) : (
              <>
                <h2>{__t("Bizga yozing")}</h2>
                <Field label={__t("Ismingiz")}>
                  <input
                    required
                    minLength={2}
                    placeholder={__t("Ismingiz")}
                    value={draft.name}
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                  />
                </Field>
                <Field label={__t("Email")}>
                  <input
                    type="email"
                    required
                    placeholder={__t("siz@example.uz")}
                    value={draft.email}
                    onChange={(e) =>
                      setDraft({ ...draft, email: e.target.value })
                    }
                  />
                </Field>
                <Field label={__t("Xabar")}>
                  <textarea
                    required
                    minLength={10}
                    placeholder={__t("Qanday yordam bera olamiz?")}
                    rows={4}
                    value={__t(draft.message)}
                    onChange={(e) =>
                      setDraft({ ...draft, message: e.target.value })
                    }
                  />
                </Field>
                <Button type="submit">
                  {__t("Davom etish")}
                  <ArrowRight size={16} />
                </Button>
              </>
            )}
          </form>
        </main>
      ) : (
        <main className="prose section container">
          <span className="eyebrow">VITRIX</span>
          <h1>
            {page === "privacy"
              ? __t("Maxfiylik siyosati")
              : __t("Foydalanish shartlari")}
          </h1>
          <p>
            {__t(
              "VITRIX hisobingiz email orqali tasdiqlanadi. Hisob, mahsulotlar, rasmlar va sayt sozlamalari platforma serverida saqlanadi.",
            )}
          </p>
          <p>
            {__t(
              "Birinchi 30 kunlik sinov bepul: 1 000 tagacha mahsulot. Tariflar va narxlar ro\u2018yxatdan o\u2018tgandan keyin kabinetda ko\u2018rsatiladi. Pullik tariflarda mahsulotlar soni cheklanmaydi. To\u2018lov administrator tasdig\u2018i bilan faollashtiriladi.",
            )}
          </p>
          <p>
            {__t(
              "Hisobingiz paroli va tasdiqlash kodini boshqalarga bermang. Joylangan mahsulotlar, rasmlar va aloqa ma\u2019lumotlarining to\u2018g\u2018riligiga biznes egasi javob beradi. Shaxsiy ma\u2019lumotlarni tuzatish yoki hisobni o\u2018chirish uchun platforma administratoriga murojaat qiling.",
            )}
          </p>
          <Link href="/register" className="btn">
            {__t("Ro\u2018yxatdan o\u2018tish")}
          </Link>
        </main>
      )}
      <Footer />
    </>
  );
}
