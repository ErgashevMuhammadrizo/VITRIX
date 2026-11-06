"use client";
import { useTranslator } from "../../i18n/runtime";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { schema, registration } from "./schema";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Mail, Check } from "lucide-react";
import { Logo, Preferences, Button, Field } from "../../components/ui/shared";
import { useApp } from "../../stores/app-store";
import { authApi } from "../../services/auth";
import { toast } from "sonner";
export function AuthPage({ mode }: { mode: string }) {
  const __t = useTranslator();
  const { login, acceptUser } = useApp();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<z.infer<typeof registration>>();
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [done, setDone] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });
  const reg = useForm<z.infer<typeof registration>>({
    resolver: zodResolver(registration),
  });
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function perform(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof Error ? __t(e.message) : __t("So\u2018rov bajarilmadi."),
      );
    } finally {
      setBusy(false);
    }
  }
  const requestCode = async (email: string, purpose: "register" | "reset") => {
    await authApi.requestCode(email, purpose);
    setCooldown(60);
    toast.success(__t("Kod emailingizga yuborildi."));
  };
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Logo light />
        <div>
          <span className="eyebrow">
            {__t("SIZNING BIZNESINGIZ. SIZNING SAYTINGIZ.")}
          </span>
          <h1>
            {__t("Katta g\u2018oyalar")}
            <br />
            {__t("oddiy qadamdan")}
            <br />
            {__t("boshlanadi.")}
          </h1>
          <p>
            {__t("Mahsulotlaringizni ko\u2018rsating.")}
            <br />
            {__t("Mijozlaringizga yaqinroq bo\u2018ling.")}
          </p>
          <div
            className="callout"
            style={{
              background: "#ffffff10",
              borderColor: "#ffffff25",
              color: "#fff",
            }}
          >
            <Mail size={24} />
            <h3 style={{ color: "white" }}>{__t("Email orqali tasdiqlash")}</h3>
            <p>
              {__t(
                "Hisobingiz faqat shaxsiy emailingizga yuborilgan kod bilan ochiladi.",
              )}
            </p>
          </div>
        </div>
        <small>{__t("\u00A9 2026 VITRIX")}</small>
      </aside>
      <main className="auth-main">
        <div className="auth-top">
          <Link href="/" className="text-link">
            <ArrowLeft size={16} />
            {__t("Bosh sahifa")}
          </Link>
          <Preferences />
        </div>
        <div className="auth-form">
          <span className="eyebrow">{__t("VITRIX GA XUSH KELIBSIZ")}</span>
          <h1>
            {mode === "register"
              ? pending
                ? __t("Emailingizni tasdiqlang.")
                : __t("Biznesingizni boshlang.")
              : mode === "forgot-password"
                ? __t("Parolni tiklash")
                : __t("Hisobingizga kiring.")}
          </h1>
          <p>
            {mode === "register"
              ? __t("Birinchi 1 oy bepul. 1 000 tagacha mahsulot.")
              : mode === "forgot-password"
                ? __t("Tasdiqlash kodi orqali parolingizni yangilang.")
                : __t("Biznesingizni boshqarishni davom ettiring.")}
          </p>
          {mode === "login" ? (
            <>
              <form
                onSubmit={form.handleSubmit((v) =>
                  perform(async () => {
                    const user = await login(v.username, v.password, remember);
                    router.push(
                      user.role === "admin" ? "/admin" : "/dashboard",
                    );
                  }),
                )}
              >
                <Field
                  label={__t("Email yoki username")}
                  error={__t(form.formState.errors.username?.message)}
                >
                  <input
                    autoComplete="username"
                    {...form.register("username")}
                  />
                </Field>
                <Field
                  label={__t("Parol")}
                  error={__t(form.formState.errors.password?.message)}
                >
                  <span className="password-input">
                    <input
                      type={show ? "text" : "password"}
                      autoComplete="current-password"
                      {...form.register("password")}
                    />
                    <button
                      type="button"
                      aria-label={__t("Parolni ko\u2018rsatish")}
                      onClick={() => setShow(!show)}
                    >
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </span>
                </Field>
                <div className="between">
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    {__t("Meni eslab qolish")}
                  </label>
                  <Link href="/forgot-password">
                    {__t("Parolni unutdingizmi?")}
                  </Link>
                </div>
                <Button type="submit" disabled={busy} className="full">
                  {busy ? "Kirilmoqda…" : __t("Kirish")}
                  <ArrowRight size={17} />
                </Button>
              </form>
              <p className="center">
                {__t("Hisobingiz yo\u2018qmi?")}{" "}
                <Link href="/register">
                  {__t("Ro\u2018yxatdan o\u2018ting")}
                </Link>
              </p>
            </>
          ) : mode === "register" ? (
            pending ? (
              <>
                <p>
                  <b>{pending.email}</b>
                  {__t(
                    "manziliga yuborilgan 6 xonali kodni kiriting. Kod 10 daqiqa amal qiladi.",
                  )}
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void perform(async () => {
                      const { user } = await authApi.register({
                        ...pending,
                        code,
                      });
                      await acceptUser(user);
                      setPending(undefined);
                      router.push("/dashboard/settings");
                    });
                  }}
                >
                  <Field label={__t("Tasdiqlash kodi")}>
                    <input
                      required
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </Field>
                  <Button type="submit" disabled={busy} className="full">
                    {busy
                      ? "Tekshirilmoqda…"
                      : __t("Tasdiqlash va hisob yaratish")}
                    <Check size={17} />
                  </Button>
                </form>
                <div className="actions" style={{ marginTop: 20 }}>
                  <Button
                    variant="secondary small"
                    disabled={busy || cooldown > 0}
                    onClick={() =>
                      void perform(() => requestCode(pending.email, "register"))
                    }
                  >
                    {cooldown
                      ? `Qayta yuborish (${cooldown}s)`
                      : __t("Kodni qayta yuborish")}
                  </Button>
                  <Button
                    variant="secondary small"
                    disabled={busy}
                    onClick={() => {
                      setPending(undefined);
                      setCode("");
                      setError("");
                    }}
                  >
                    {__t("Emailni o\u2018zgartirish")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <form
                  onSubmit={reg.handleSubmit((v) =>
                    perform(async () => {
                      await requestCode(v.email, "register");
                      setPending(v);
                    }),
                  )}
                >
                  <div className="form-grid">
                    {(
                      [
                        "firstName",
                        "lastName",
                        "email",
                        "phone",
                        "username",
                        "password",
                        "confirm",
                      ] as const
                    ).map((key, i) => (
                      <Field
                        key={key}
                        label={
                          [
                            __t("Ism"),
                            __t("Familiya"),
                            __t("Email"),
                            __t("Telefon"),
                            __t("Username"),
                            __t("Parol"),
                            __t("Parolni tasdiqlash"),
                          ][i]
                        }
                        error={__t(reg.formState.errors[key]?.message)}
                      >
                        <input
                          autoComplete={
                            key === "password" ? "new-password" : undefined
                          }
                          type={
                            key === "email"
                              ? "email"
                              : key === "password" || key === "confirm"
                                ? show
                                  ? "text"
                                  : "password"
                                : "text"
                          }
                          {...reg.register(key)}
                        />
                      </Field>
                    ))}
                  </div>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={show}
                      onChange={(e) => setShow(e.target.checked)}
                    />
                    {__t("Parolni ko\u2018rsatish")}
                  </label>
                  <label className="check">
                    <input type="checkbox" {...reg.register("terms")} />
                    <span>
                      <Link href="/terms" target="_blank">
                        {__t("Foydalanish shartlari")}
                      </Link>
                      {__t("ga roziman")}
                    </span>
                  </label>
                  {reg.formState.errors.terms && (
                    <small className="error">
                      {__t(reg.formState.errors.terms.message)}
                    </small>
                  )}
                  <Button type="submit" disabled={busy} className="full">
                    {busy ? "Yuborilmoqda…" : __t("Emailga kod yuborish")}
                    <Mail size={17} />
                  </Button>
                </form>
                <p className="center">
                  {__t("Hisobingiz bormi?")}
                  <Link href="/login">{__t("Kirish")}</Link>
                </p>
              </>
            )
          ) : done ? (
            <div className="callout">
              <Check />
              <h3>{__t("Parol yangilandi.")}</h3>
              <Link href="/login" className="btn">
                {__t("Hisobingizga kirish")}
              </Link>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void perform(async () => {
                  if (!resetSent) {
                    await requestCode(resetEmail, "reset");
                    setResetSent(true);
                  } else {
                    await authApi.resetPassword(
                      resetEmail,
                      code,
                      resetPassword,
                    );
                    setDone(true);
                  }
                });
              }}
            >
              <Field label={__t("Email")}>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  readOnly={resetSent}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </Field>
              {resetSent && (
                <>
                  <Field label={__t("Tasdiqlash kodi")}>
                    <input
                      required
                      pattern="[0-9]{6}"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </Field>
                  <Field label={__t("Yangi parol")}>
                    <input
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                    />
                  </Field>
                </>
              )}
              <Button type="submit" disabled={busy} className="full">
                {busy
                  ? "Kutilmoqda…"
                  : resetSent
                    ? __t("Parolni yangilash")
                    : __t("Emailga kod yuborish")}
              </Button>
              {resetSent && (
                <Button
                  type="button"
                  variant="secondary small"
                  disabled={busy || cooldown > 0}
                  onClick={() =>
                    void perform(() => requestCode(resetEmail, "reset"))
                  }
                >
                  {cooldown ? `${cooldown}s` : __t("Kodni qayta yuborish")}
                </Button>
              )}
            </form>
          )}
          {error && (
            <p className="error" role="alert" style={{ marginTop: 20 }}>
              {error}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
