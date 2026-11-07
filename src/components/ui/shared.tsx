"use client";
import NextImage from "next/image";
import { useTranslator } from "../../i18n/runtime";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
} from "react";
import {
  X,
  ImagePlus,
  Globe,
  Sun,
  Moon,
  Copy,
  ExternalLink,
  Search,
} from "lucide-react";
import { useApp } from "../../stores/app-store";
import { toast } from "sonner";
import Link from "next/link";
import { Button as ShadcnButton } from "../../../components/ui/button";
export function Button({
  children,
  variant = "",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: string;
}) {
  return (
    <ShadcnButton
      {...props}
      variant={
        variant.includes("danger")
          ? "destructive"
          : variant.includes("secondary")
            ? "outline"
            : "default"
      }
      className={`btn ${variant} ${className}`}
    >
      {children}
    </ShadcnButton>
  );
}
export function Logo({ light = false }: { light?: boolean }) {
  const __t = useTranslator();
  const { db } = useApp();
  return (
    <Link
      href="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label={__t("Bosh sahifa")}
    >
      {db.platform.logo ? (
        <NextImage
          unoptimized
          width={800}
          height={800}
          src={db.platform.logo}
          alt=""
        />
      ) : null}
      <span>{db.platform.name}</span>
    </Link>
  );
}
export function Preferences() {
  const __t = useTranslator();
  const { dark, toggleDark, language, setLanguage } = useApp();
  return (
    <div className="preferences">
      <label className="sr-only" htmlFor="language">
        {__t("Til")}
      </label>
      <Globe size={15} />
      <select
        id="language"
        aria-label={__t("Til")}
        value={language}
        onChange={(e) => setLanguage(e.target.value as "uz" | "ru" | "en")}
      >
        <option value="uz">UZ</option>
        <option value="ru">RU</option>
        <option value="en">EN</option>
      </select>
      <button
        className="icon-btn"
        onClick={toggleDark}
        aria-label={__t("Rang rejimi")}
      >
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
}
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  const __t = useTranslator();
  return (
    <label className="field">
      <span>{__t(label)}</span>
      {children}
      {error && <small className="error">{__t(error)}</small>}
    </label>
  );
}
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const __t = useTranslator();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.focus();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const items = ref.current?.querySelectorAll<HTMLElement>(
          'button,input,select,textarea,a[href],[tabindex="0"]',
        );
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={__t(title)}
        className={`modal ${wide ? "wide" : ""}`}
      >
        <div className="modal-title">
          <h2>{__t(title)}</h2>
          <button
            className="icon-btn"
            aria-label={__t("Yopish")}
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Confirm({
  title,
  onConfirm,
  onClose,
}: {
  title: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const __t = useTranslator();
  return (
    <Modal title={title} onClose={onClose}>
      <p>
        {__t(
          "Bu amalni tasdiqlang. O\u2018chirilgan ma\u2019lumot qaytarilmaydi.",
        )}
      </p>
      <div className="actions end">
        <Button variant="secondary" onClick={onClose}>
          {__t("Bekor qilish")}
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {__t("Tasdiqlash")}
        </Button>
      </div>
    </Modal>
  );
}
export function UploadImage({
  value,
  onChange,
  label = "Rasm yuklash",
}: {
  value: string;
  onChange: (s: string) => void;
  label?: string;
}) {
  const __t = useTranslator();
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  function read(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error(__t("JPG, PNG yoki WebP rasmini tanlang"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(__t("Rasm 2 MB dan oshmasin"));
      return;
    }
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result));
      setBusy(false);
    };
    reader.onerror = () => {
      toast.error(__t("Rasm o\u2018qilmadi"));
      setBusy(false);
    };
    reader.readAsDataURL(file);
  }
  return (
    <div
      className="upload"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        read(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={input}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          read(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {value ? (
        <>
          <NextImage
            unoptimized
            width={800}
            height={800}
            src={value}
            alt={__t("Yuklangan rasm")}
          />
          <button
            type="button"
            className="remove-image"
            aria-label={__t("Rasmni o\u2018chirish")}
            onClick={() => onChange("")}
          >
            <X size={16} />
          </button>
        </>
      ) : (
        <ImagePlus size={24} />
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? __t("Yuklanmoqda\u2026") : __t(label)}
      </button>
      <small>
        {__t("Olib tashlang yoki tanlang \u00B7 JPG, PNG, WebP \u00B7 2 MB")}
      </small>
    </div>
  );
}
export function Empty({
  title = "Hozircha ma’lumot yo‘q",
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  const __t = useTranslator();
  return (
    <div className="empty">
      <Search size={28} />
      <h3>{__t(title)}</h3>
      <p>
        {children ??
          __t(
            "Yangi ma\u2019lumot qo\u2018shing yoki filtrlarni o\u2018zgartiring.",
          )}
      </p>
    </div>
  );
}
export function Loading() {
  const __t = useTranslator();
  return (
    <div className="loading" aria-label={__t("Yuklanmoqda")} role="status">
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
      <p>{__t("Yuklanmoqda\u2026")}</p>
    </div>
  );
}
export function SiteLink({ slug }: { slug: string }) {
  const __t = useTranslator();
  const [origin, setOrigin] = useState("");
  // Read browser-only origin after hydration; the initial SSR value stays empty.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOrigin(location.origin), []);
  return (
    <div className="site-link">
      <Globe size={18} />
      <span>
        {origin}/{slug}
      </span>
      <button
        className="icon-btn"
        title={__t("Havolani nusxalash")}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(`${location.origin}/${slug}`);
            toast.success(__t("Havola nusxalandi"));
          } catch {
            toast.error(
              __t("Nusxalab bo\u2018lmadi. Havolani qo\u2018lda belgilang."),
            );
          }
        }}
      >
        <Copy size={16} />
      </button>
      <Link href={`/${slug}`} target="_blank" title={__t("Saytni ochish")}>
        <ExternalLink size={16} />
      </Link>
    </div>
  );
}
export function Pagination({
  page,
  total,
  size = 8,
  onChange,
}: {
  page: number;
  total: number;
  size?: number;
  onChange: (n: number) => void;
}) {
  const __t = useTranslator();
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="pagination">
      <span>
        {total}
        {__t("ta natija \u00B7")}
        {Math.min(page, pages)} / {pages}
      </span>
      <div className="actions">
        <Button
          variant="secondary small"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          {__t("Oldingi")}
        </Button>
        <Button
          variant="secondary small"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          {__t("Keyingi")}
        </Button>
      </div>
    </div>
  );
}
export function useDirtyWarning(dirty: boolean) {
  const __t = useTranslator();
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    const click = (e: MouseEvent) => {
      if (!dirty) return;
      const a = (e.target as HTMLElement).closest("a");
      if (
        a &&
        a.href !== location.href &&
        !window.confirm(
          __t("Saqlanmagan o\u2018zgarishlar bor. Sahifadan chiqasizmi?"),
        )
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", h);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", h);
      document.removeEventListener("click", click, true);
    };
  }, [dirty, __t]);
}
