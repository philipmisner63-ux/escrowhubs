import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { hasLocale } from "next-intl";

// Static map so bundler can resolve all message files at build time
const messageLoaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  en:    () => import("../messages/en.json"),
  ar:    () => import("../messages/ar.json"),
  es:    () => import("../messages/es.json"),
  zh:    () => import("../messages/zh.json"),
  ru:    () => import("../messages/ru.json"),
  "pt-BR": () => import("../messages/pt-BR.json"),
  tr:    () => import("../messages/tr.json"),
  hi:    () => import("../messages/hi.json"),
  fr:    () => import("../messages/fr.json"),
  de:    () => import("../messages/de.json"),
  ko:    () => import("../messages/ko.json"),
  ja:    () => import("../messages/ja.json"),
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  let messages: Record<string, unknown>;
  try {
    const loader = messageLoaders[locale] ?? messageLoaders["en"];
    messages = (await loader()).default;
  } catch {
    // Fallback to English if locale file fails to load
    messages = (await messageLoaders["en"]()).default;
  }

  return { locale, messages };
});
