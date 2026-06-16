import { createElement, Fragment, type CSSProperties, type ReactNode } from "react";
import { codeToHast } from "shiki";
import { RawFileActions } from "@/components/repository/raw-file-actions";
import { LocalizedText } from "@/components/system/localized-text";

type CodeViewerProps = {
  code: string | null;
  language: string | null;
  path: string;
  rawHref?: string;
  downloadHref?: string;
};

type HastNode = {
  type: string;
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function toReactStyle(value: unknown): CSSProperties | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const style: Record<string, string> = {};

  for (const declaration of value.split(";")) {
    const [rawName, ...rawValue] = declaration.split(":");
    const name = rawName?.trim();
    const propertyValue = rawValue.join(":").trim();

    if (!name || !propertyValue || !/^#[0-9a-f]{3,8}$/i.test(propertyValue)) {
      continue;
    }

    if (name === "color" || name === "background-color" || /^--shiki(?:-[a-z]+)*$/i.test(name)) {
      style[name === "background-color" ? "backgroundColor" : name] = propertyValue;
    }
  }

  return Object.keys(style).length ? (style as CSSProperties) : undefined;
}

function toReactProps(properties: Record<string, unknown> | undefined) {
  const props: Record<string, unknown> = {};
  const className = properties?.class;

  if (typeof className === "string" && /^[a-z0-9_\-\s]+$/i.test(className)) {
    props.className = className;
  } else if (Array.isArray(className) && className.every((item) => typeof item === "string" && /^[a-z0-9_-]+$/i.test(item))) {
    props.className = className.join(" ");
  }

  const style = toReactStyle(properties?.style);

  if (style) {
    props.style = style;
  }

  if (properties?.tabindex === "0" || properties?.tabIndex === 0) {
    props.tabIndex = 0;
  }

  return props;
}

function hastToReact(node: HastNode, key = "root"): ReactNode {
  if (node.type === "text") {
    return node.value || "";
  }

  if (node.type === "root") {
    return <Fragment key={key}>{node.children?.map((child, index) => hastToReact(child, `${key}-${index}`))}</Fragment>;
  }

  if (node.type !== "element" || !node.tagName || !["pre", "code", "span"].includes(node.tagName)) {
    return null;
  }

  return createElement(node.tagName, { key, ...toReactProps(node.properties) }, node.children?.map((child, index) => hastToReact(child, `${key}-${index}`)));
}

export async function CodeViewer({ code, language, path, rawHref = "#", downloadHref = "#" }: CodeViewerProps) {
  if (code === null) {
    return (
      <div className="rounded-lg border border-line bg-surface px-6 py-16 text-center text-sm text-secondary">
        <LocalizedText path="repo.largeFileTitle" />
      </div>
    );
  }

  const highlighted = await codeToHast(code, {
    lang: language || "text",
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
  }).catch(() =>
    codeToHast(code, {
      lang: "text",
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    }),
  );

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex min-h-11 items-center justify-between gap-2 border-b border-line bg-subtle px-3">
        <p className="min-w-0 flex-1 truncate font-mono text-xs text-secondary">{path}</p>
        <RawFileActions path={path} rawHref={rawHref} downloadHref={downloadHref} code={code} />
      </div>
      <div className="max-h-[calc(100dvh-220px)] overflow-auto text-[13px] leading-6">{hastToReact(highlighted as HastNode)}</div>
    </div>
  );
}
