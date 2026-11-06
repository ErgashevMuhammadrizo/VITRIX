"use client";
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
  Upload,
  ImagePlus,
  ArrowUpRight,
  Check,
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
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) {
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
  const { db } = useApp();
  return (
    <Link
      href="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="Bosh sahifa"
    >
      {db.platform.logo ? (
        <img src={db.platform.logo} alt="" />
      ) : (
        <span className="brand-icon">
          v<span />
        </span>
      )}
      <span>{db.platform.name}</span>
    </Link>
  );
}
export function Preferences() {
  const { dark, toggleDark, language, setLanguage } = useApp();
  return (
    <div className="preferences">
      <label className="sr-only" htmlFor="language">
        Til
      </label>
      <Globe size={15} />
      <select
        id="language"
        aria-label="Til"
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
        aria-label="Rang rejimi"
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
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small className="error">{error}</small>}
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
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
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
        aria-label={title}
        className={`modal ${wide ? "wide" : ""}`}
      >
        <div className="modal-title">
          <h2>{title}</h2>
          <button className="icon-btn" aria-label="Yopish" onClick={onClose}>
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
  return (
    <Modal title={title} onClose={onClose}>
      <p>Bu amalni tasdiqlang. O‘chirilgan ma’lumot qaytarilmaydi.</p>
      <div className="actions end">
        <Button variant="secondary" onClick={onClose}>
          Bekor qilish
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          Tasdiqlash
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
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  function read(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("JPG, PNG yoki WebP rasmini tanlang");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Rasm 2 MB dan oshmasin");
      return;
    }
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result));
      setBusy(false);
    };
    reader.onerror = () => {
      toast.error("Rasm o‘qilmadi");
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
          <img src={value} alt="Yuklangan rasm" />
          <button
            type="button"
            className="remove-image"
            aria-label="Rasmni o‘chirish"
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
        {busy ? "Yuklanmoqda…" : label}
      </button>
      <small>Olib tashlang yoki tanlang · JPG, PNG, WebP · 2 MB</small>
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
  return (
    <div className="empty">
      <Search size={28} />
      <h3>{title}</h3>
      <p>
        {children ?? "Yangi ma’lumot qo‘shing yoki filtrlarni o‘zgartiring."}
      </p>
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" aria-label="Yuklanmoqda" role="status">
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
      <p>Yuklanmoqda…</p>
    </div>
  );
}
export function SiteLink({ slug }: { slug: string }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(location.origin), []);
  return (
    <div className="site-link">
      <Globe size={18} />
      <span>
        {origin}/{slug}
      </span>
      <button
        className="icon-btn"
        title="Havolani nusxalash"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(`${location.origin}/${slug}`);
            toast.success("Havola nusxalandi");
          } catch {
            toast.error("Nusxalab bo‘lmadi. Havolani qo‘lda belgilang.");
          }
        }}
      >
        <Copy size={16} />
      </button>
      <Link href={`/${slug}`} target="_blank" title="Saytni ochish">
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
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="pagination">
      <span>
        {total} ta natija · {Math.min(page, pages)} / {pages}
      </span>
      <div className="actions">
        <Button
          variant="secondary small"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Oldingi
        </Button>
        <Button
          variant="secondary small"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Keyingi
        </Button>
      </div>
    </div>
  );
}
export function useDirtyWarning(dirty: boolean) {
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
        !window.confirm("Saqlanmagan o‘zgarishlar bor. Sahifadan chiqasizmi?")
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
  }, [dirty]);
}
