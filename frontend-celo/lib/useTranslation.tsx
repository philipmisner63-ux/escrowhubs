"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { en } from "./translations/en";
import { sw } from "./translations/sw";
import { es } from "./translations/es";
import { pt } from "./translations/pt";
import { fr } from "./translations/fr";
import { ar } from "./translations/ar";
import { hi } from "./translations/hi";
import { zh } from "./translations/zh";

export type Lang = "en" | "sw" | "es" | "pt" | "fr" | "ar" | "hi" | "zh";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const translations: Record<Lang, any> = { en, sw, es, pt, fr, ar, hi, zh };

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const val = path.split(".").reduce((acc: any, key: string) => acc?.[key], obj);
  return typeof val === "string" ? val : path;
}

interface TranslationContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

const TranslationContext = createContext<TranslationContextValue>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("eh-lang") as Lang | null;
    if (stored && stored in translations) setLangState(stored as Lang);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("eh-lang", l);
  }

  function t(key: string, vars?: Record<string, string>): string {
    let val = getNestedValue(translations[lang], key);
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, v);
      });
    }
    return val;
  }

  return (
    <TranslationContext.Provider value={{ lang, setLang, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}
