import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectReadableLocale, shouldOfferTranslation } from "@/lib/i18n/language";
import { translateMarkdown } from "@/server/markdown/translation";

describe("markdown translation", () => {
  beforeEach(() => {
    process.env.DATABASE_URL ||= "postgresql://user:pass@localhost:5432/db";
    process.env.AUTH_SECRET ||= "abcdefghijklmnopqrstuvwxyz123456";
    process.env.TRANSLATE_API_URL = "https://translate.example/translate";
    process.env.TRANSLATE_MAX_CHARS = "12000";
    process.env.TRANSLATE_TIMEOUT_MS = "12000";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, init) => {
        const body = JSON.parse(String(init?.body)) as { q: string };
        return new Response(JSON.stringify({ translatedText: `ru:${body.q}` }), { status: 200 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("detects when a README should be translated for the selected locale", () => {
    const english = "This project is a small code editor for public work. It includes README files, issues, uploads and project pages for people who need a calm publishing space.";
    const russian = "Это проект для публикации файлов и описаний. Он помогает загружать папки, читать README и обсуждать задачи в спокойном интерфейсе.";

    expect(detectReadableLocale(english)).toBe("en");
    expect(detectReadableLocale(russian)).toBe("ru");
    expect(shouldOfferTranslation(english, "ru")).toBe(true);
    expect(shouldOfferTranslation(russian, "ru")).toBe(false);
  });

  it("translates text without changing code, image URLs or link URLs", async () => {
    const markdown = [
      "# Project",
      "",
      "Open [the site](https://example.com) before upload.",
      "",
      "![Banner](./assets/banner.png)",
      "",
      "```ts",
      "const value = 'do not translate';",
      "```",
      "",
      "> [!WARNING]",
      "> Keep this note visible.",
    ].join("\n");

    const translated = await translateMarkdown({ markdown, targetLocale: "ru", sourceLocale: "en" });

    expect(translated).toContain("ru:Project");
    expect(translated).toContain("https://example.com");
    expect(translated).toContain("./assets/banner.png");
    expect(translated).toContain("const value = 'do not translate';");
    expect(translated).toContain("[!WARNING]");
    expect(translated).toContain("ru:Keep this note visible.");
  });

  it("rejects oversized markdown before calling the translation service", async () => {
    process.env.TRANSLATE_MAX_CHARS = "10";

    await expect(translateMarkdown({ markdown: "This README is too long.", targetLocale: "ru", sourceLocale: "en" })).rejects.toThrow("too long");
    expect(fetch).not.toHaveBeenCalled();
  });
});
