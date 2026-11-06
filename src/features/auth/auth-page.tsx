"use client";
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
      setError(e instanceof Error ? e.message : "So‘rov bajarilmadi.");
    } finally {
      setBusy(false);
    }
  }
  const requestCode = async (email: string, purpose: "register" | "reset") => {
    await authApi.requestCode(email, purpose);
    setCooldown(60);
    toast.success("Kod emailingizga yuborildi.");
  };
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Logo light />
        <div>
          <span className="eyebrow">
            SIZNING BIZNESINGIZ. SIZNING SAYTINGIZ.
          </span>
          <h1>
            Katta g‘oyalar
            <br />
            oddiy qadamdan
            <br />
            boshlanadi.
          </h1>
          <p>
            Mahsulotlaringizni ko‘rsating.
            <br />
            Mijozlaringizga yaqinroq bo‘ling.
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
            <h3 style={{ color: "white" }}>Email orqali tasdiqlash</h3>
            <p>
              Hisobingiz faqat shaxsiy emailingizga yuborilgan kod bilan
              ochiladi.
            </p>
          </div>
        </div>
        <small>© 2026 VITRIX</small>
      </aside>
      <main className="auth-main">
        <div className="auth-top">
          <Link href="/" className="text-link">
            <ArrowLeft size={16} />
            Bosh sahifa
          </Link>
          <Preferences />
        </div>
        <div className="auth-form">
          <span className="eyebrow">VITRIX GA XUSH KELIBSIZ</span>
          <h1>
            {mode === "register"
              ? pending
                ? "Emailingizni tasdiqlang."
                : "Biznesingizni boshlang."
              : mode === "forgot-password"
                ? "Parolni tiklash"
                : "Hisobingizga kiring."}
          </h1>
          <p>
            {mode === "register"
              ? "Birinchi 1 oy bepul. 1 000 tagacha mahsulot."
              : mode === "forgot-password"
                ? "Tasdiqlash kodi orqali parolingizni yangilang."
                : "Biznesingizni boshqarishni davom ettiring."}
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
                  label="Email yoki username"
                  error={form.formState.errors.username?.message}
                >
                  <input
                    autoComplete="username"
                    {...form.register("username")}
                  />
                </Field>
                <Field
                  label="Parol"
                  error={form.formState.errors.password?.message}
                >
                  <span className="password-input">
                    <input
                      type={show ? "text" : "password"}
                      autoComplete="current-password"
                      {...form.register("password")}
                    />
                    <button
                      type="button"
                      aria-label="Parolni ko‘rsatish"
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
                    Meni eslab qolish
                  </label>
                  <Link href="/forgot-password">Parolni unutdingizmi?</Link>
                </div>
                <Button type="submit" disabled={busy} className="full">
                  {busy ? "Kirilmoqda…" : "Kirish"}
                  <ArrowRight size={17} />
                </Button>
              </form>
              <p className="center">
                Hisobingiz yo‘qmi?{" "}
                <Link href="/register">Ro‘yxatdan o‘ting</Link>
              </p>
            </>
          ) : mode === "register" ? (
            pending ? (
              <>
                <p>
                  <b>{pending.email}</b> manziliga yuborilgan 6 xonali kodni
                  kiriting. Kod 10 daqiqa amal qiladi.
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
                  <Field label="Tasdiqlash kodi">
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
                    {busy ? "Tekshirilmoqda…" : "Tasdiqlash va hisob yaratish"}
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
                      : "Kodni qayta yuborish"}
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
                    Emailni o‘zgartirish
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
                            "Ism",
                            "Familiya",
                            "Email",
                            "Telefon",
                            "Username",
                            "Parol",
                            "Parolni tasdiqlash",
                          ][i]
                        }
                        error={reg.formState.errors[key]?.message}
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
                    Parolni ko‘rsatish
                  </label>
                  <label className="check">
                    <input type="checkbox" {...reg.register("terms")} />
                    <span>
                      <Link href="/terms" target="_blank">
                        Foydalanish shartlari
                      </Link>
                      ga roziman
                    </span>
                  </label>
                  {reg.formState.errors.terms && (
                    <small className="error">
                      {reg.formState.errors.terms.message}
                    </small>
                  )}
                  <Button type="submit" disabled={busy} className="full">
                    {busy ? "Yuborilmoqda…" : "Emailga kod yuborish"}
                    <Mail size={17} />
                  </Button>
                </form>
                <p className="center">
                  Hisobingiz bormi? <Link href="/login">Kirish</Link>
                </p>
              </>
            )
          ) : done ? (
            <div className="callout">
              <Check />
              <h3>Parol yangilandi.</h3>
              <Link href="/login" className="btn">
                Hisobingizga kirish
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
              <Field label="Email">
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
                  <Field label="Tasdiqlash kodi">
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
                  <Field label="Yangi parol">
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
                    ? "Parolni yangilash"
                    : "Emailga kod yuborish"}
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
                  {cooldown ? `${cooldown}s` : "Kodni qayta yuborish"}
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
