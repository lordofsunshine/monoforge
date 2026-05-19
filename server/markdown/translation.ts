import type { Root, Text } from "mdast";
import translate from "translate";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { visit } from "unist-util-visit";
import { getEnv } from "@/lib/env";
import { detectReadableLocale } from "@/lib/i18n/language";
import type { Locale } from "@/lib/i18n/dictionaries";

const skippedParents = new Set(["code", "inlineCode", "html", "image", "imageReference", "definition"]);
const defaultLibreEndpoint = "https://libretranslate.com/translate";

function normalizeSourceLocale(markdown: string, sourceLocale?: Locale) {
  const detected = sourceLocale || detectReadableLocale(markdown);
  return detected === "unknown" ? "auto" : detected;
}

function shouldTranslateText(value: string) {
  return value.trim().length >= 2 && /[\p{L}\p{Script=Cyrillic}]/u.test(value);
}

function splitAlertMarker(value: string) {
  const match = value.match(/^(\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*)([\s\S]*)$/i);

  if (!match) {
    return null;
  }

  return {
    marker: match[1],
    text: match[3],
  };
}

async function translateText(value: string, targetLocale: Locale, sourceLocale: Locale | "auto", signal: AbortSignal) {
  const env = getEnv();

  if (env.TRANSLATE_API_URL === defaultLibreEndpoint) {
    try {
      translate.engine = "google";
      return await translate(value, { from: sourceLocale === "auto" ? (targetLocale === "ru" ? "en" : "ru") : sourceLocale, to: targetLocale });
    } catch {
      return value;
    }
  }

  try {
    const response = await fetch(env.TRANSLATE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: value,
        source: sourceLocale === "auto" ? "auto" : sourceLocale,
        target: targetLocale,
        format: "text",
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error("Translation service is unavailable");
    }

    const payload = (await response.json()) as { translatedText?: string };
    return payload.translatedText || value;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    try {
      translate.engine = "google";
      return await translate(value, { from: sourceLocale === "auto" ? (targetLocale === "ru" ? "en" : "ru") : sourceLocale, to: targetLocale });
    } catch {
      return value;
    }
  }
}

function preserveWhitespace(original: string, translated: string) {
  const leading = original.match(/^\s*/)?.[0] || "";
  const trailing = original.match(/\s*$/)?.[0] || "";
  return `${leading}${translated.trim()}${trailing}`;
}

async function runPool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index++];
      await worker(item);
    }
  });

  await Promise.all(workers);
}

function restoreAlertMarkers(markdown: string) {
  return markdown.replace(/^> \\\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/gim, "> [!$1]");
}

export async function translateMarkdown(input: { markdown: string; targetLocale: Locale; sourceLocale?: Locale }) {
  const env = getEnv();

  if (input.markdown.length > env.TRANSLATE_MAX_CHARS) {
    throw new Error("Markdown is too long to translate safely");
  }

  const sourceLocale = normalizeSourceLocale(input.markdown, input.sourceLocale);
  const tree = unified().use(remarkParse).parse(input.markdown) as Root;
  const nodes: Text[] = [];

  visit(tree, "text", (node, _index, parent) => {
    if (parent && skippedParents.has(parent.type)) {
      return;
    }

    if (shouldTranslateText(node.value)) {
      nodes.push(node);
    }
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.TRANSLATE_TIMEOUT_MS);

  try {
    await runPool(nodes, 5, async (node) => {
      const alert = splitAlertMarker(node.value);

      if (alert) {
        const translated = await translateText(alert.text.trim(), input.targetLocale, sourceLocale, controller.signal);
        node.value = `${alert.marker}${preserveWhitespace(alert.text, translated)}`;
        return;
      }

      const translated = await translateText(node.value.trim(), input.targetLocale, sourceLocale, controller.signal);
      node.value = preserveWhitespace(node.value, translated);
    });
  } finally {
    clearTimeout(timeout);
  }

  const markdown = unified()
    .use(remarkStringify, {
      bullet: "-",
      fences: true,
      rule: "-",
    })
    .stringify(tree);

  return restoreAlertMarkers(markdown);
}
