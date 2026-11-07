"use client";
import NextImage from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Image as ImageIcon,
  Palette,
  Link2,
  MessageCircle,
  ShieldCheck,
  Globe,
  Plus,
  Phone,
  Search,
} from "lucide-react";
import { useTranslator } from "../../i18n/runtime";
export function ClarityLanding() {
  const t = useTranslator();
  const steps = [
    [
      "01",
      "Ro‘yxatdan o‘ting",
      "Email kodingizni tasdiqlang va biznesingizni tanishtiring.",
      ShieldCheck,
    ],
    [
      "02",
      "Mahsulotlarni qo‘shing",
      "Rasm, narx va tavsiflar bilan katalogingizni to‘ldiring.",
      ImageIcon,
    ],
    [
      "03",
      "Ko‘rinishini moslang",
      "Brend ranglari va sizga mos ko‘rinishni tanlang.",
      Palette,
    ],
    [
      "04",
      "Havolani ulashing",
      "Xaridor tanlaydi va siz bilan bevosita bog‘lanadi.",
      Link2,
    ],
  ] as const;
  return (
    <main className="clarity">
      <section className="clarity-hero container">
        <div className="clarity-copy">
          <span className="clarity-eyebrow">
            <span /> {t("KICHIK BIZNES UCHUN ONLAYN KATALOG")}
          </span>
          <h1>
            {t("Mahsulotlaringiz.")}
            <br />
            <em>{t("Bitta havola.")}</em>
          </h1>
          <p>
            {t(
              "Rasmlar, narxlar va aloqa ma’lumotlari — bitta tartibli katalogda. Xaridor tanlaydi va sizga Telegram yoki telefon orqali bog‘lanadi.",
            )}
          </p>
          <div className="clarity-actions">
            <Link href="/register" className="btn">
              {t("Katalog yaratishni boshlash")}
              <ArrowUpRight size={19} />
            </Link>
            <Link href="/demo" className="btn secondary">
              {t("Namunani ko‘rish")}
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="clarity-proof">
            <span>
              <Check size={15} />
              {t("30 kun sinov")}
            </span>
            <span>
              <Check size={15} />
              {t("1000 tagacha mahsulot")}
            </span>
            <span>
              <Check size={15} />
              {t("Karta kerak emas")}
            </span>
          </div>
          <div className="clarity-note">
            <Globe size={16} />
            <span>
              {t(
                "UZ / RU / EN interfeys. Kontent tarjimalari sizning nazoratingizda.",
              )}
            </span>
          </div>
        </div>
        <div className="clarity-showcase">
          <div className="catalog-browser">
            <div className="catalog-browser-bar">
              <span>● ● ●</span>
              <span>vitrix / studio</span>
              <ShieldCheck size={14} />
            </div>
            <div className="catalog-mock">
              <div className="mock-store">
                <b>
                  STUDIO<span> / collection</span>
                </b>
                <small>{t("Namuna katalog")}</small>
              </div>
              <div className="mock-heading">
                <span>{t("YANGI KOLLEKSIYA")}</span>
                <h2>
                  {t("Sizning uslubingiz.")}
                  <br />
                  {t("Sizning katalogingiz.")}
                </h2>
                <p>{t("Har bir mahsulot — o‘z o‘rnida.")}</p>
              </div>
              <div className="mock-filters">
                <span className="active">{t("Barchasi")}</span>
                <span>{t("Kiyimlar")}</span>
                <span>{t("Aksessuarlar")}</span>
                <Search size={14} />
              </div>
              <div className="mock-products">
                {[
                  ["shirt", "Kundalik ko‘ylak", "189 000"],
                  ["bag", "Shahar sumkasi", "249 000"],
                  ["jacket", "Yengil jaket", "329 000"],
                ].map(([image, name, price]) => (
                  <Link href="/demo" key={image}>
                    <div>
                      <NextImage
                        unoptimized
                        width={800}
                        height={800}
                        src={"/images/" + image + ".svg"}
                        alt={t(name)}
                      />
                    </div>
                    <small>{t("NAMUNA")}</small>
                    <b>{t(name)}</b>
                    <span>
                      {price} {t("so‘m")}
                    </span>
                  </Link>
                ))}
              </div>
              <div className="mock-contact">
                <span>
                  <MessageCircle size={16} />
                  {t("Mahsulotni tanlang. Bizga yozing.")}
                </span>
                <ArrowUpRight size={16} />
              </div>
            </div>
          </div>
          <div className="clarity-floating">
            <span>
              <Link2 size={20} />
            </span>
            <div>
              <b>{t("Ulashishga tayyor")}</b>
              <small>{t("Instagram · Telegram · QR")}</small>
            </div>
            <Check size={18} />
          </div>
        </div>
      </section>
      <div className="clarity-strip container">
        <span>{t("Kiyim va aksessuar do‘konlari uchun")}</span>
        <b>{t("Tartibli assortiment")}</b>
        <b>{t("O‘z dizayningiz")}</b>
        <b>{t("Bevosita aloqa")}</b>
      </div>
      <section className="clarity-section container">
        <div className="clarity-section-head">
          <span className="clarity-eyebrow">{t("SODDA JARAYON")}</span>
          <h2>{t("Rasmlardan — tayyor kataloggacha.")}</h2>
          <p>
            {t("Asosiy ma’lumotlar bir joyda. Yangilash ham o‘z qo‘lingizda.")}
          </p>
        </div>
        <div className="clarity-steps">
          {steps.map(([n, title, description, Icon]) => (
            <article key={n}>
              <div>
                <Icon size={22} />
                <span>{n}</span>
              </div>
              <h3>{t(title)}</h3>
              <p>{t(description)}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="clarity-value container">
        <div>
          <span className="clarity-eyebrow">
            {t("HAR SAFAR RASM YUBORISH O‘RNIGA")}
          </span>
          <h2>
            {t("Bitta manzil.")}
            <br />
            {t("Aktual assortiment.")}
          </h2>
          <p>
            {t(
              "Mahsulot rasmlari, narxlari va tavsiflarini katalogda yangilang. Havolani profilingizda va xaridorlar bilan yozishmalarda ulashing.",
            )}
          </p>
          <Link className="text-link" href="/register">
            {t("O‘z katalogimni yaratish")} <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="clarity-feature-list">
          {[
            [
              ImageIcon,
              "Tovarlaringiz tartib bilan",
              "Kategoriyalar, galereya, tavsif va mavjudlik holati.",
            ],
            [
              Palette,
              "Ko‘rinish sizga mos",
              "Ranglar, shakllar, banner va saqlangan dizaynlar tarixi.",
            ],
            [
              MessageCircle,
              "Muloqotga bir qadam",
              "Xaridor katalogdan Telegram yoki telefoningizga o‘tadi.",
            ],
          ].map(([Icon, title, description]) => {
            const I = Icon as typeof Phone;
            return (
              <article key={String(title)}>
                <span>
                  <I size={21} />
                </span>
                <div>
                  <h3>{t(String(title))}</h3>
                  <p>{t(String(description))}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <section className="clarity-section container clarity-faq">
        <div>
          <span className="clarity-eyebrow">{t("ANIQ JAVOBLAR")}</span>
          <h2>{t("Boshlashdan oldin.")}</h2>
          <p>
            {t("Tarif tafsilotlari ro‘yxatdan o‘tgach kabinetda ko‘rsatiladi.")}
          </p>
        </div>
        <div>
          {[
            [
              "VITRIX orqali to‘lov qilish mumkinmi?",
              "Hozircha katalog ichida savat va avtomatik to‘lov mavjud emas. Xaridor siz bilan Telegram yoki telefon orqali bog‘lanadi.",
            ],
            [
              "Sinov muddati qancha?",
              "Dastlabki 30 kun sinov, 1000 tagacha mahsulot. Keyingi tariflar kabinetda ko‘rsatiladi.",
            ],
            [
              "Mahsulot matnlari avtomatik tarjima qilinadimi?",
              "Yo‘q. O‘zbek, rus va ingliz tilidagi matnlarni o‘zingiz kiritasiz. Bo‘sh tarjimada asosiy matn ko‘rsatiladi.",
            ],
            [
              "Dizaynni qaytarish mumkinmi?",
              "Ha. Tahrirni ortga qaytarish yoki saqlangan dizayn versiyasini tiklash mumkin.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {t(q)}
                <Plus size={18} />
              </summary>
              <p>{t(a)}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="clarity-bottom container">
        <div>
          <span>{t("VITRIX — DEALS loyihasi")}</span>
          <h2>{t("Mahsulotlaringiz. Bitta havola.")}</h2>
          <p>{t("Katalogingizni tayyorlang. Havolangizni ulashing.")}</p>
        </div>
        <Link href="/register" className="btn">
          {t("Katalog yaratishni boshlash")}
          <ArrowUpRight size={18} />
        </Link>
      </section>
    </main>
  );
}
