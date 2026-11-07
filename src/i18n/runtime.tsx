"use client";
import {
  createContext,
  useContext,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import type { Language } from "./index";
import { translate, createTranslator } from "./translate";
export { translate, createTranslator };
const LanguageContext = createContext<Language>("uz");
export function I18nProvider({
  language,
  children,
  documentLanguage = false,
}: {
  language: Language;
  children?: ReactNode;
  documentLanguage?: boolean;
}) {
  useEffect(() => {
    if (!documentLanguage) return;
    const old = document.documentElement.lang;
    document.documentElement.lang = language;
    return () => {
      document.documentElement.lang = old;
    };
  }, [language, documentLanguage]);
  return (
    <LanguageContext.Provider value={language}>
      {children}
    </LanguageContext.Provider>
  );
}
export function useTranslator() {
  const language = useContext(LanguageContext);
  return useMemo(() => createTranslator(language), [language]);
}
