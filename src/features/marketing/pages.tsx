"use client";
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
const capabilities = [
  {
    icon: Globe,
    title: "O‘z saytingiz. O‘z manzilingiz.",
    text: "Har bir biznes uchun mustaqil sahifa. Faqat sizning brendingiz va mahsulotlaringiz.",
  },
  {
    icon: Palette,
    title: "Dizayn — didingizga mos",
    text: "Uchta tayyor uslub, brend ranglari va rasmlaringiz bilan saytingizga o‘ziga xoslik bering.",
  },
  {
    icon: Smartphone,
    title: "Har bir ekranda mukammal",
    text: "Telefon, planshet yoki kompyuter — mijozlaringizga hamisha qulay.",
  },
  {
    icon: Package,
    title: "Katalogni oson boshqaring",
    text: "Mahsulotlar, narxlar va kategoriyalarni bir joydan yangilang.",
  },
  {
    icon: Send,
    title: "Mijoz bilan bevosita aloqa",
    text: "Mijozlar sizga telefon yoki Telegram orqali to‘g‘ridan-to‘g‘ri murojaat qiladi.",
  },
  {
    icon: BarChart3,
    title: "Natijani kuzatib boring",
    text: "Saytga tashriflar va aloqa tugmalariga bosilishlarni kuzating.",
  },
];
export function Pricing() {
  const { db } = useApp();
  return (
    <div className="pricing-grid">
      {db.plans.map((plan, i) => (
        <article
          className={`price-card ${i === 1 ? "recommended" : ""}`}
          key={plan.id}
        >
          {i === 1 && <span className="recommended-label">TAVSIYA ETAMIZ</span>}
          <h3>{plan.name}</h3>
          <p>
            {i === 0
              ? "Birinchi qadamingiz uchun"
              : i === 1
                ? "O‘sayotgan biznesingiz uchun"
                : "Hisobot va tahlilni qadrlaydiganlar uchun"}
          </p>
          <div className="price">
            {plan.price ? money(plan.price) : "Bepul"}
            <small>{plan.price > 0 ? " / oy" : " / birinchi 1 oy"}</small>
          </div>
          <Link
            href={`/register?plan=${plan.id}`}
            className={`btn ${i !== 1 ? "secondary" : ""}`}
          >
            {i === 0 ? "1 oy bepul boshlash" : "Tarifni tanlash"}
            <ArrowUpRight size={17} />
          </Link>
          <ul>
            {plan.features.split("\n").map((f) => (
              <li key={f}>
                <Check size={16} />
                {f}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
function DemoPreview() {
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
            Menyu <i>Biz haqimizda</i>
          </span>
          <a href="/demo">Bog‘lanish ↗</a>
        </div>
        <div className="preview-hero">
          <div>
            <span className="tiny-label">FRESH. TASTY. YOURS.</span>
            <h3>
              Haqiqiy ta’m.
              <br />
              Har bir luqmada.
            </h3>
            <p>
              Yangi masalliqlar va mehr bilan
              <br />
              tayyorlangan sevimli burgerlaringiz.
            </p>
            <Link href="/demo">
              Menyuni ko‘rish <ArrowRight size={12} />
            </Link>
          </div>
          <img src="/images/burger.jpg" alt="Burger House burgeri" />
        </div>
        <div className="preview-products">
          <b>Sevimlingizni tanlang</b>
          <div>
            {[
              ["burger", "Classic Burger", "35 000"],
              ["double", "Double Cheese", "48 000"],
              ["fries", "French Fries", "16 000"],
            ].map(([im, n, p]) => (
              <Link href="/demo" className="mini-product" key={n}>
                <img src={`/images/${im}.jpg`} alt={n} />
                <strong>{n}</strong>
                <small>{p} so‘m</small>
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
          <small>Saytingiz doimo ochiq</small>
          <strong>
            24/7 <span>onlayn</span>
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
        <span className="live-dot" /> Saytingiz tayyor!
        <Check size={13} />
      </div>
      <div className="cursor-note">
        <MousePointer2 size={20} fill="#315beb" /> Sizning biznesingiz
      </div>
    </div>
  );
}
export function MarketingPage({ page = "" }: { page?: string }) {
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
        Biznesingiz uchun sayt.
        <br />
        Professional.
        <br />
        <em>Dasturchisiz.</em>
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
                  <span className="live-dot" /> KATTA IMKONIYATLAR. ODDIY
                  BOSHLANISH.
                </span>
                <h1>{heroTitle}</h1>
                <p>
                  Bir necha daqiqada o‘z biznes saytingizni yarating.
                  <br className="desktop" /> Mahsulotlaringizni joylang va
                  mijozlaringizga
                  <br className="desktop" /> bitta havola bilan ulashing.
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
                    Bepul boshlang
                  </span>
                  <span>
                    <Check size={14} />
                    Karta talab qilinmaydi
                  </span>
                  <span>
                    <Check size={14} />
                    Bir necha daqiqada
                  </span>
                </div>
              </div>
              <DemoPreview />
            </section>
            <div className="business-types container">
              <span>HAR QANDAY BIZNES UCHUN</span>
              {[
                [Utensils, "Kafe va restoran"],
                [ShoppingBag, "Do‘kon va butik"],
                [Cake, "Qandolatchilik"],
                [Flower2, "Gul do‘konlari"],
              ].map(([Icon, label]) => {
                const I = Icon as typeof Store;
                return (
                  <div key={String(label)}>
                    <I size={19} />
                    {String(label)}
                  </div>
                );
              })}
              <span className="more-types">va yana ko‘plab bizneslar ↗</span>
            </div>
            <section className="section container">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">MURAKKABLIK ORTDA QOLSIN</span>
                  <h2>
                    G‘oyangizdan saytingizgacha.
                    <br />
                    Atigi uchta qadam.
                  </h2>
                </div>
                <p>
                  Texnik bilim shart emas.
                  <br />
                  Biznesingizni sizdan yaxshi kim biladi?
                </p>
              </div>
              <div className="steps">
                {[
                  [
                    "01",
                    "Biznesingizni tanishtiring",
                    "Nom, logo va aloqa ma’lumotlarini kiriting.",
                    Store,
                  ],
                  [
                    "02",
                    "Katalogingizni yarating",
                    "Rasm, narx va tavsif bilan mahsulotlarni qo‘shing.",
                    Package,
                  ],
                  [
                    "03",
                    "Havolangizni ulashing",
                    "Tayyor saytingizni Instagram va Telegramga joylang.",
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
                    <span className="eyebrow">BARCHASI BIR JOYDA</span>
                    <h2>
                      Kichik biznes uchun.
                      <br />
                      Katta imkoniyatlar bilan.
                    </h2>
                  </div>
                  <Link href="/features" className="text-link">
                    Barcha imkoniyatlar
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
            <section className="section container">
              <div className="section-heading centered">
                <span className="eyebrow">SIZGA MOS TARIF</span>
                <h2>Oddiy narxlar. Aniq imkoniyatlar.</h2>
                <p>
                  Bepul boshlang. Biznesingiz o‘sganda, imkoniyatlarni
                  kengaytiring.
                </p>
              </div>
              <Pricing />
            </section>
            <section className="faq-section container">
              <div>
                <span className="eyebrow">SAVOLLARINGIZ BORMI?</span>
                <h2>
                  Javoblar
                  <br />
                  shu yerda.
                </h2>
                <Link href="/contact" className="text-link">
                  Biz bilan bog‘laning
                  <ArrowUpRight size={18} />
                </Link>
              </div>
              <div className="faqs">
                {[
                  [
                    "Sayt yaratish uchun dasturlashni bilishim kerakmi?",
                    "Yo‘q. Ma’lumotlarni kiriting, mahsulot qo‘shing va tayyor dizayndan birini tanlang.",
                  ],
                  [
                    "Mijozlarim ro‘yxatdan o‘tishi kerakmi?",
                    "Yo‘q. Saytingiz havolasi mijozlarga to‘g‘ridan-to‘g‘ri katalogingizni ochadi.",
                  ],
                  [
                    "Buyurtmalarni qanday qabul qilaman?",
                    "Mijozlaringiz telefon yoki Telegram tugmasi orqali siz bilan bog‘lanadi. Savatcha va to‘lov tizimi qo‘shilmagan.",
                  ],
                  [
                    "Ma’lumotlar qayerda saqlanadi?",
                    "Hisob va katalog ma’lumotlari serverda saqlanadi. Saytingizni boshqa qurilmadan ham ochish mumkin.",
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
            <span className="eyebrow">TARIFLAR</span>
            <h1>Biznesingizga mos reja.</h1>
            <p>Barcha tariflarda mustaqil sayt va mobil dizayn.</p>
          </div>
          <Pricing />
          <p className="muted center">
            Tariflar oylik. Obuna administrator to‘lovni tasdiqlagach
            faollashadi.
          </p>
        </main>
      ) : page === "features" ? (
        <>
          <main className="section container">
            <div className="section-heading centered">
              <span className="eyebrow">IMKONIYATLAR</span>
              <h1>
                Boshqarish oson.
                <br />
                Natijasi professional.
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
          <span className="eyebrow">BIZ HAQIMIZDA</span>
          <h1>
            Har bir biznesning
            <br />
            o‘z manzili bo‘lsin.
          </h1>
          <p className="lead">
            VITRIX — kichik va o‘rta bizneslar o‘z mahsulotlarini internetda
            sodda va chiroyli namoyish etishi uchun yaratilgan platforma.
          </p>
          <p>
            Biznes egasi uchun eng muhim ish — mijozlariga xizmat ko‘rsatish.
            Biz saytni boshqarishni qulay qilamiz: mahsulotlar, dizayn va aloqa
            ma’lumotlari bir kabinetda.
          </p>
          <div className="callout">
            <Globe />
            <h3>Mustaqil sahifa, bevosita aloqa.</h3>
            <p>
              Har bir biznes o‘z katalogiga ega. Mijozlar telefon va Telegram
              orqali bevosita sizga murojaat qiladi.
            </p>
          </div>
          <Link className="btn" href="/register">
            Boshlash
            <ArrowRight size={18} />
          </Link>
        </main>
      ) : page === "contact" ? (
        <main className="container section contact-grid">
          <div>
            <span className="eyebrow">BOG‘LANISH</span>
            <h1>
              Birgalikda
              <br />
              boshlaymiz.
            </h1>
            <p>Savollaringiz va takliflaringiz uchun ochiqmiz.</p>
            <a href={`mailto:${db.platform.email}`} className="contact-line">
              <Mail />
              {db.platform.email}
            </a>
            <a href={`tel:${db.platform.phone}`} className="contact-line">
              <Phone />
              {db.platform.phone}
            </a>
            <small className="muted">
              Aloqa ma’lumotlarini platforma administratori yangilaydi.
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
                <h2>Xabaringiz tayyor</h2>
                <p>
                  Xabaringizni email ilovangiz orqali jo‘natish uchun quyidagi
                  havoladan foydalaning.
                </p>
                <a
                  className="btn"
                  href={`mailto:${db.platform.email}?subject=${encodeURIComponent("VITRIX: " + draft.name)}&body=${encodeURIComponent(draft.message + "\n\n" + draft.name + "\n" + draft.email)}`}
                >
                  Email ochish
                  <ArrowUpRight size={16} />
                </a>
              </>
            ) : (
              <>
                <h2>Bizga yozing</h2>
                <Field label="Ismingiz">
                  <input
                    required
                    minLength={2}
                    placeholder="Ismingiz"
                    value={draft.name}
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    required
                    placeholder="siz@example.uz"
                    value={draft.email}
                    onChange={(e) =>
                      setDraft({ ...draft, email: e.target.value })
                    }
                  />
                </Field>
                <Field label="Xabar">
                  <textarea
                    required
                    minLength={10}
                    placeholder="Qanday yordam bera olamiz?"
                    rows={4}
                    value={draft.message}
                    onChange={(e) =>
                      setDraft({ ...draft, message: e.target.value })
                    }
                  />
                </Field>
                <Button type="submit">
                  Davom etish
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
              ? "Maxfiylik siyosati"
              : "Foydalanish shartlari"}
          </h1>
          <p>
            VITRIX hisobingiz email orqali tasdiqlanadi. Hisob, mahsulotlar,
            rasmlar va sayt sozlamalari platforma serverida saqlanadi.
          </p>
          <p>
            Birinchi 30 kunlik sinov bepul: 1 000 tagacha mahsulot. Keyin Pro —
            20 000 so‘m/oy yoki VIP — 39 000 so‘m/oy. Pullik tariflarda
            mahsulotlar soni cheklanmaydi. To‘lov administrator tasdig‘i bilan
            faollashtiriladi.
          </p>
          <p>
            Hisobingiz paroli va tasdiqlash kodini boshqalarga bermang.
            Joylangan mahsulotlar, rasmlar va aloqa ma’lumotlarining
            to‘g‘riligiga biznes egasi javob beradi. Shaxsiy ma’lumotlarni
            tuzatish yoki hisobni o‘chirish uchun platforma administratoriga
            murojaat qiling.
          </p>
          <Link href="/register" className="btn">
            Ro‘yxatdan o‘tish
          </Link>
        </main>
      )}
      <Footer />
    </>
  );
}
