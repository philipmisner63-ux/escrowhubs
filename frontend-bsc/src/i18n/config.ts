export const locales = ["en", "ar", "es", "zh", "ru", "pt-BR", "tr", "hi", "fr", "de", "ko", "ja"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeMetadata: Record<Locale, { name: string; nativeName: string; flag: string; dir: "ltr" | "rtl" }> = {
  en:    { name: "English",    nativeName: "English",    flag: "🇬🇧", dir: "ltr" },
  ar:    { name: "Arabic",     nativeName: "العربية",    flag: "🇸🇦", dir: "rtl" },
  es:    { name: "Spanish",    nativeName: "Español",    flag: "🇪🇸", dir: "ltr" },
  zh:    { name: "Chinese",    nativeName: "中文",        flag: "🇨🇳", dir: "ltr" },
  ru:    { name: "Russian",    nativeName: "Русский",    flag: "🇷🇺", dir: "ltr" },
  "pt-BR": { name: "Portuguese", nativeName: "Português", flag: "🇧🇷", dir: "ltr" },
  tr:    { name: "Turkish",    nativeName: "Türkçe",     flag: "🇹🇷", dir: "ltr" },
  hi:    { name: "Hindi",      nativeName: "हिन्दी",      flag: "🇮🇳", dir: "ltr" },
  fr:    { name: "French",     nativeName: "Français",   flag: "🇫🇷", dir: "ltr" },
  de:    { name: "German",     nativeName: "Deutsch",    flag: "🇩🇪", dir: "ltr" },
  ko:    { name: "Korean",     nativeName: "한국어",      flag: "🇰🇷", dir: "ltr" },
  ja:    { name: "Japanese",   nativeName: "日本語",      flag: "🇯🇵", dir: "ltr" },
};
