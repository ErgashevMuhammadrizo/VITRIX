"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight, ArrowRight } from "lucide-react";
import { Logo, Preferences } from "../ui/shared";
import { useApp } from "../../stores/app-store";
export function Navbar() {
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
          <Link onClick={() => setOpen(false)} href="/pricing">
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
            aria-label="Menyu"
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
  const { db, t } = useApp();
  return (
    <footer className="footer container">
      <div>
        <Logo />
        <p>Biznesingizning yangi manzili.</p>
        <small>
          © {new Date().getFullYear()} {db.platform.name}. Barcha huquqlar
          himoyalangan.
        </small>
      </div>
      <div>
        <h4>Platforma</h4>
        <Link href="/features">{t("features")}</Link>
        <Link href="/pricing">{t("pricing")}</Link>
        <Link href="/demo">Namuna sayt</Link>
      </div>
      <div>
        <h4>Kompaniya</h4>
        <Link href="/about">{t("about")}</Link>
        <Link href="/contact">{t("contact")}</Link>
        <Link href="/terms">Foydalanish shartlari</Link>
        <Link href="/privacy">Maxfiylik</Link>
      </div>
      <div className="footer-note">
        <span className="live-dot" /> O‘zbekistondagi bizneslar uchun
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
  return (
    <section className="cta container">
      <div>
        <span className="eyebrow">KEYINGI QADAM SIZDAN</span>
        <h2>
          Biznesingizga yangi
          <br />
          imkoniyatlar eshigini oching.
        </h2>
        <p>Mahsulotlaringiz. O‘z dizayningiz. Bitta havola.</p>
      </div>
      <Link href="/register" className="btn white">
        Bepul boshlash
        <ArrowRight size={18} />
      </Link>
    </section>
  );
}
