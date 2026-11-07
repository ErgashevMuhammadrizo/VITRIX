"use client";
import { ClarityLanding } from "./clarity-landing";
import { useTranslator } from "../../i18n/runtime";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Globe,
  Palette,
  BarChart3,
  Smartphone,
  Package,
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
  const { db } = useApp();
  const [sent, setSent] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", message: "" });
  return (
    <>
      <Navbar />
      {page === "" ? (
        <ClarityLanding />
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
