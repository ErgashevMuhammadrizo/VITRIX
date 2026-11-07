"use client";
import { useTranslator } from "../../i18n/runtime";
import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight, ArrowRight } from "lucide-react";
import { Logo, Preferences } from "../ui/shared";
import { useApp } from "../../stores/app-store";
export function Navbar() {
  const __t = useTranslator();
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <header className="nav-wrap">
      <nav className="navbar container">
        <Logo />
        <div className={`nav-links ${open ? "open" : ""}`}>
          <Link onClick={() => setOpen(false)} href="/features">
            {t("features")}
          </Link>
          <Link onClick={() => setOpen(false)} href="/dashboard/subscription">
            {t("pricing")}
          </Link>
          <Link onClick={() => setOpen(false)} href="/about">
            {t("about")}
          </Link>
          <Link onClick={() => setOpen(false)} href="/contact">
            {t("contact")}
          </Link>
        </div>
        <div className="nav-actions">
          <Preferences />
          <Link className="login-link" href="/login">
            {t("login")}
          </Link>
          <Link href="/register" className="btn small">
            {t("create")}
            <ArrowUpRight size={16} />
          </Link>
          <button
            className="icon-btn mobile-menu"
            aria-label={__t("Menyu")}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>
    </header>
  );
}
export function Footer() {
  const __t = useTranslator();
  const { db, t } = useApp();
  return (
    <footer className="footer container">
      <div>
        <Logo />
        <p>{__t("Mahsulotlaringiz. Bitta havola.")}</p>
        <small>{__t("VITRIX \u2014 DEALS loyihasi")}</small>
        <small>
          © {new Date().getFullYear()} {db.platform.name}
          {__t(". Barcha huquqlar himoyalangan.")}
        </small>
      </div>
      <div>
        <h4>{__t("Platforma")}</h4>
        <Link href="/features">{t("features")}</Link>
        <Link href="/dashboard/subscription">{t("pricing")}</Link>
        <Link href="/demo">{__t("Namuna sayt")}</Link>
      </div>
      <div>
        <h4>{__t("Kompaniya")}</h4>
        <Link href="/about">{t("about")}</Link>
        <Link href="/contact">{t("contact")}</Link>
        <Link href="/terms">{__t("Foydalanish shartlari")}</Link>
        <Link href="/privacy">{__t("Maxfiylik")}</Link>
      </div>
      <div className="footer-note">
        <span className="live-dot" />
        {__t("O\u2018zbekistondagi bizneslar uchun")}
        <br />
        {db.platform.email && (
          <a href={`mailto:${db.platform.email}`}>
            {db.platform.email}
            <ArrowUpRight size={14} />
          </a>
        )}
      </div>
    </footer>
  );
}
export function CTA() {
  const __t = useTranslator();
  return (
    <section className="cta container">
      <div>
        <span className="eyebrow">{__t("KEYINGI QADAM SIZDAN")}</span>
        <h2>
          {__t("Biznesingizga yangi")}
          <br />
          {__t("imkoniyatlar eshigini oching.")}
        </h2>
        <p>{__t("Mahsulotlaringiz. O\u2018z dizayningiz. Bitta havola.")}</p>
      </div>
      <Link href="/register" className="btn white">
        {__t("Bepul boshlash")}
        <ArrowRight size={18} />
      </Link>
    </section>
  );
}
