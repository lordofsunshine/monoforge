import type { Locale } from "@/lib/i18n/dictionaries";

export function detectReadableLocale(input: string): Locale | "unknown" {
  const text = input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{Script=Cyrillic}a-zA-Z\s]/gu, " ")
    .trim();

  if (text.length < 80) {
    return "unknown";
  }

  const cyrillic = text.match(/\p{Script=Cyrillic}/gu)?.length ?? 0;
  const latin = text.match(/[a-zA-Z]/g)?.length ?? 0;
  const total = Math.max(1, cyrillic + latin);

  if (cyrillic / total >= 0.35) {
    return "ru";
  }

  if (latin / total >= 0.65) {
    return "en";
  }

  return "unknown";
}

export function shouldOfferTranslation(input: string, targetLocale: Locale) {
  const sourceLocale = detectReadableLocale(input);
  return sourceLocale !== "unknown" && sourceLocale !== targetLocale;
}
