"use client";
import { useState, useEffect, type CSSProperties } from "react";
import {
  Phone,
  Send,
  ArrowUpRight,
  MapPin,
  Clock,
  Search,
  ChevronRight,
  Globe,
  Check,
  ImageIcon,
} from "lucide-react";
import { useApp } from "../../stores/app-store";
import { Modal, Empty } from "../ui/shared";
import { money, telegram } from "../../lib/utils";
import { publicDictionaries, type Language } from "../../i18n";
import { tenantCategories, tenantProducts } from "../../services/selectors";
import { publicApi } from "../../services/workspace";
import {
  appearanceOf,
  businessFonts,
} from "../../features/businesses/appearance";
import {
  mapLink,
  validCoordinates,
  osmEmbed,
} from "../../features/location/location-utils";
import type { Business, Product } from "../../types";
export function BusinessSite({
  business,
  preview = false,
  data,
}: {
  business: Business;
  preview?: boolean;
  data?: import("../../services/workspace").PublicCatalog;
}) {
  const { db: storeDb } = useApp();
  const db = data
    ? { ...storeDb, products: data.products, categories: data.categories }
    : storeDb;
  const a = appearanceOf(business);
  const locationUrl = mapLink(business);
  const copy =
    publicDictionaries[business.language as Language] ?? publicDictionaries.uz;
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Product>();
  const [image, setImage] = useState("");
  const categories = tenantCategories(db, business.id);
  const allProducts = tenantProducts(db, business.id);
  const products = allProducts.filter(
    (p) =>
      (!a.showCategories || !cat || p.categoryId === cat) &&
      (!a.showSearch || p.name.toLowerCase().includes(q.toLowerCase())),
  );
  useEffect(() => {
    if (preview) return;
    void publicApi.track(business.slug, "visit").catch(() => {});
    document.title = business.name;
    document.documentElement.lang = business.language;
  }, [business.slug, preview]);
  const track = (kind: "phone" | "telegram") => {
    if (!preview) void publicApi.track(business.slug, kind).catch(() => {});
  };
  const contact = (product?: Product) =>
    !a.showContacts ? null : (
      <div className="business-contact">
        {business.phone && (
          <a
            className="btn business-btn"
            href={`tel:${business.phone.replace(/\s/g, "")}`}
            onClick={() => track("phone")}
          >
            <Phone size={16} />
            {copy.call}
          </a>
        )}
        {business.telegram && (
          <a
            className="btn business-outline"
            href={telegram(
              business.telegram,
              product ? copy.message + product.name : undefined,
            )}
            target="_blank"
            rel="noreferrer"
            onClick={() => track("telegram")}
          >
            <Send size={16} />
            Telegram
          </a>
        )}
      </div>
    );
  return (
    <div
      className={`business-site custom-appearance mode-${a.colorMode} hero-${a.heroStyle} width-${a.contentWidth} corners-${a.cornerStyle} density-${a.density} ${!a.showPrices ? "hide-prices" : ""} ${!a.showContacts ? "hide-contacts" : ""} theme-${business.theme} layout-${business.layout} card-${business.card} header-${business.header} buttons-${business.buttons} ${preview ? "site-preview" : ""}`}
      style={
        {
          "--business-primary": business.primary,
          "--business-secondary": business.secondary,
          "--business-bg": a.backgroundColor,
          "--business-surface": a.surfaceColor,
          "--business-ink": a.textColor,
          "--business-surface-ink": a.surfaceTextColor,
          "--business-muted": a.mutedColor,
          "--business-cols": a.productColumns,
          "--business-mobile-cols": a.mobileColumns,
          fontFamily: businessFonts[business.font] || businessFonts.sans,
        } as CSSProperties
      }
    >
      <header className="business-nav business-container">
        <a href="#business-top" className="business-logo">
          {business.logo ? (
            <img src={business.logo} alt="" />
          ) : (
            <span>{business.name.slice(0, 1)}.</span>
          )}
          <b>{business.name}</b>
        </a>
        <a href="#catalog" className="desktop">
          {copy.menu}
        </a>
        <a href="#business-contact" className="desktop">
          {copy.about}
        </a>
        <a
          className="business-top-contact"
          href={`tel:${business.phone}`}
          onClick={() => track("phone")}
        >
          {copy.contact}
          <ArrowUpRight size={16} />
        </a>
      </header>
      <main id="business-top">
        {a.showHero && (
          <section className="business-hero business-container">
            <div>
              <span className="tiny-label">{copy.tagline}</span>
              <h1>{a.heroTitle || business.name}</h1>
              <p>{business.description}</p>
              {contact()}
              <span className="business-hours">
                <span className="live-dot" />
                {business.hours || copy.welcome}
              </span>
            </div>
            {business.cover ? (
              <img
                src={business.cover}
                alt={business.name}
                className="business-cover"
              />
            ) : (
              <div className="business-cover no-cover">
                <span>{business.name.slice(0, 1)}</span>
              </div>
            )}
          </section>
        )}
        <section id="catalog" className="business-container catalog">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{copy.catalog}</span>
              <h2>{copy.choose}</h2>
              <p>{copy.intro}</p>
            </div>
            {a.showSearch && (
              <div className="search-input">
                <Search size={17} />
                <input
                  aria-label="Katalogdan qidirish"
                  placeholder={copy.search}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            )}
          </div>
          {a.showCategories && (
            <div className="category-tabs">
              <button
                className={!cat ? "selected" : ""}
                onClick={() => setCat("")}
              >
                {copy.all} <span>{allProducts.length}</span>
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={cat === c.id ? "selected" : ""}
                  onClick={() => setCat(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
          {products.length ? (
            <div className="product-grid">
              {products.map((p) => (
                <article className="public-product" key={p.id}>
                  <button
                    className="public-image"
                    onClick={() => {
                      setSelected(p);
                      setImage(p.image);
                    }}
                    aria-label={p.name + " batafsil"}
                  >
                    {p.image ? (
                      <img src={p.image} alt={p.name} loading="lazy" />
                    ) : (
                      <div className="no-product-image">
                        <ImageIcon size={32} />
                      </div>
                    )}
                    {p.featured && (
                      <span className="badge">{copy.featured}</span>
                    )}
                    {p.availability === "unavailable" && (
                      <span className="unavailable">{copy.unavailable}</span>
                    )}
                  </button>
                  <div className="public-product-body">
                    <small>
                      {categories.find((c) => c.id === p.categoryId)?.name}
                    </small>
                    <h3>
                      <button
                        onClick={() => {
                          setSelected(p);
                          setImage(p.image);
                        }}
                      >
                        {p.name}
                      </button>
                    </h3>
                    <p>{p.shortDescription}</p>
                    <div className="between">
                      <strong className="public-price">{money(p.price)}</strong>
                      {p.oldPrice > 0 && <del>{money(p.oldPrice)}</del>}
                    </div>
                    <button
                      className="detail-link"
                      onClick={() => {
                        setSelected(p);
                        setImage(p.image);
                      }}
                    >
                      {copy.detail}
                      <ArrowUpRight size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Empty title={copy.empty}>{copy.emptyHint}</Empty>
          )}
        </section>
        <section
          id="business-contact"
          className="business-about business-container"
        >
          <div>
            <span className="eyebrow">{copy.closer}</span>
            <h2>{copy.questions}</h2>
            <p>{copy.hint}</p>
            {contact()}
          </div>
          <div>
            {a.showLocation && business.address && (
              <p>
                <MapPin size={18} />
                {business.address}
              </p>
            )}
            {a.showLocation && locationUrl && (
              <div className="public-location">
                {validCoordinates(business.latitude, business.longitude) && (
                  <iframe
                    loading="lazy"
                    title="Biznes lokatsiyasi"
                    src={osmEmbed(business.latitude!, business.longitude!)}
                    referrerPolicy="no-referrer"
                  />
                )}
                <a
                  className="text-link"
                  href={locationUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin size={18} />
                  Xaritada ochish ↗
                </a>
              </div>
            )}
            {business.hours && (
              <p>
                <Clock size={18} />
                {business.hours}
              </p>
            )}
            {business.instagram && (
              <a href={business.instagram} target="_blank" rel="noreferrer">
                <Globe size={18} />
                Instagram
                <ArrowUpRight size={15} />
              </a>
            )}
          </div>
        </section>
      </main>
      <footer className="business-footer business-container">
        <b>{business.name}</b>
        <span>
          © {new Date().getFullYear()} {copy.copyright}
        </span>
        <a href={`tel:${business.phone}`} onClick={() => track("phone")}>
          {business.phone}
        </a>
        {business.telegram && (
          <a
            href={telegram(business.telegram)}
            target="_blank"
            rel="noreferrer"
            onClick={() => track("telegram")}
          >
            Telegram ↗
          </a>
        )}
      </footer>
      {selected && (
        <Modal
          title={selected.name}
          onClose={() => setSelected(undefined)}
          wide
        >
          <div className="product-detail">
            <div>
              {image && (
                <img
                  className="detail-main-image"
                  src={image}
                  alt={selected.name}
                />
              )}
              <div className="thumbnails">
                {[selected.image, ...selected.images]
                  .filter(Boolean)
                  .map((im, i) => (
                    <button
                      onClick={() => setImage(im)}
                      key={i}
                      aria-label={`Rasm ${i + 1}`}
                    >
                      <img src={im} alt="" />
                    </button>
                  ))}
              </div>
            </div>
            <div>
              <span
                className={`badge ${selected.availability === "available" ? "green" : "gray"}`}
              >
                {selected.availability === "available"
                  ? copy.available
                  : copy.unavailable}
              </span>
              <h2>{selected.name}</h2>
              <h3 className="public-price">{money(selected.price)}</h3>
              {selected.oldPrice > 0 && <del>{money(selected.oldPrice)}</del>}
              <p className="preserve">{selected.description}</p>
              {contact(selected)}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
