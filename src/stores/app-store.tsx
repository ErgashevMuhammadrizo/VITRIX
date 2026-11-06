"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { I18nProvider, createTranslator } from "../i18n/runtime";
import { preferenceApi } from "../services/api";
import { authApi } from "../services/auth";
import { workspaceApi, publicApi, emptyWorkspace } from "../services/workspace";
import { dictionaries, type Language, type TranslationKey } from "../i18n";
import type { Database, User } from "../types";
import { uid } from "../lib/utils";
import { toast, Toaster } from "sonner";
type Context = {
  db: Database;
  user: User | undefined;
  ready: boolean;
  error: string;
  update: (fn: (d: Database) => void, message?: string) => Promise<boolean>;
  login: (
    username: string,
    password: string,
    remember: boolean,
  ) => Promise<User>;
  acceptUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  reset: () => void;
  reload: () => Promise<void>;
  requestPlan: (id: string) => Promise<void>;
  reviewPlan: (id: string, approve: boolean) => Promise<void>;
  language: Language;
  setLanguage: (l: Language) => void;
  dark: boolean;
  toggleDark: () => void;
  t: (key: TranslationKey) => string;
};
const Store = createContext<Context | null>(null);
const initial = () => emptyWorkspace();
export function AppProvider({
  children,
  initialLanguage = "uz",
}: {
  children?: ReactNode;
  initialLanguage?: Language;
}) {
  const [db, setDb] = useState<Database>(initial);
  const dbRef = useRef(db);
  const [user, setUser] = useState<User>();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const __t = createTranslator(language);
  const [dark, setDark] = useState(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  function apply(next: Database) {
    dbRef.current = next;
    setDb(next);
  }
  async function reload() {
    const next = await workspaceApi.load();
    apply(next);
    setError("");
  }
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const p = preferenceApi.load();
        if (active) {
          setLanguage(p.language in dictionaries ? p.language : "uz");
          setDark(p.dark);
        }
      } catch {}
      try {
        const { user: account } = await authApi.me();
        if (active) {
          setUser(account);
          try {
            const next = await workspaceApi.load();
            if (active) apply(next);
          } catch (e) {
            if (active)
              setError(
                e instanceof Error
                  ? __t(e.message)
                  : __t("Ma\u2019lumotlarni ochib bo\u2018lmadi."),
              );
          }
        }
      } catch {
        try {
          const config = await publicApi.config();
          if (active) apply({ ...initial(), ...config });
        } catch {
          /* Pricing and sample previews work while the server is being configured. */
        }
      } finally {
        if (active) setReady(true);
      }
    }
    void init();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.lang = language;
    if (ready)
      try {
        preferenceApi.save({ language, dark });
      } catch {}
  }, [dark, language, ready]);
  async function update(
    fn: (d: Database) => void,
    message = __t("Saqlandi"),
  ): Promise<boolean> {
    const task = queue.current.then(async () => {
      try {
        const before = dbRef.current;
        const after = structuredClone(before);
        fn(after);
        const saved = await workspaceApi.save(before, after);
        apply(saved);
        if (message) toast.success(message);
        return true;
      } catch (e) {
        toast.error(
          e instanceof Error
            ? __t(e.message)
            : __t("Saqlash bajarilmadi."),
        );
        return false;
      }
    });
    queue.current = task;
    return task;
  }
  async function acceptUser(account: User) {
    setUser(account);
    await reload();
  }
  return (
    <I18nProvider language={language}>
      <Store.Provider
        value={{
          db,
          user,
          ready,
          error,
          language,
          setLanguage,
          dark,
          toggleDark: () => setDark(!dark),
          t: (k) => dictionaries[language][k],
          update,
          acceptUser,
          reload,
          requestPlan: async (id) => {
            apply(await workspaceApi.requestPlan(id));
            toast.success(
              __t("Ariza yuborildi. Administrator tasdig‘ini kuting."),
            );
          },
          reviewPlan: async (id, approve) => {
            apply(await workspaceApi.reviewPlan(id, approve));
            toast.success(
              approve
                ? __t("Obuna faollashtirildi.")
                : __t("Ariza rad etildi."),
            );
          },
          login: async (username, password, remember) => {
            const { user: account } = await authApi.login(
              username,
              password,
              remember,
            );
            await acceptUser(account);
            return account;
          },
          logout: async () => {
            await authApi.logout();
            setUser(undefined);
            apply(initial());
          },
          reset: () => {
            void reload().catch((e) => toast.error(__t(e.message)));
          },
        }}
      >
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </Store.Provider>
    </I18nProvider>
  );
}
export const useApp = () => {
  const c = useContext(Store);
  if (!c) throw new Error("Provider missing");
  return c;
};
export const recordActivity = (
  db: Database,
  businessId: string,
  text: string,
) => {
  db.activities.unshift({
    id: uid(),
    businessId,
    text,
    at: new Date().toISOString(),
  });
};
