import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import type { Html, Image, Root } from "mdast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";

type MarkdownRendererProps = {
  content: string | null | undefined;
  empty?: string;
  owner?: string;
  repo?: string;
  sourcePath?: string | null;
  allowHtmlImages?: boolean;
};

function encodeRepoPath(repoPath: string) {
  return repoPath.split("/").map(encodeURIComponent).join("/");
}

function normalizeRelativePath(input: string, sourcePath?: string | null) {
  const cleaned = input.replaceAll("\\", "/").split("#")[0].split("?")[0];
  const parts = [...(sourcePath?.includes("/") ? sourcePath.split("/").slice(0, -1) : []), ...cleaned.split("/")];
  const output: string[] = [];

  for (const part of parts) {
    if (!part || part === ".") {
      continue;
    }

    if (part === "..") {
      output.pop();
      continue;
    }

    output.push(part);
  }

  return output.join("/");
}

function isUnsafeUrl(value: string) {
  return /^(javascript|data|vbscript):/i.test(value.trim());
}

function isExternalUrl(value: string) {
  return /^(https?:|mailto:)/i.test(value.trim());
}

function safeHref(href: string | undefined, owner?: string, repo?: string, sourcePath?: string | null) {
  if (!href) {
    return "#";
  }

  const trimmed = href.trim();

  if (isUnsafeUrl(trimmed)) {
    return "#";
  }

  if (trimmed.startsWith("#") || isExternalUrl(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  if (!owner || !repo) {
    return trimmed;
  }

  const hash = trimmed.includes("#") ? `#${trimmed.split("#").slice(1).join("#")}` : "";
  const query = trimmed.includes("?") ? `?${trimmed.split("?").slice(1).join("?").split("#")[0]}` : "";
  const repoPath = normalizeRelativePath(trimmed, sourcePath);
  return `/${owner}/${repo}/blob/${encodeRepoPath(repoPath)}${query}${hash}`;
}

function safeImageSrc(src: string | undefined, owner?: string, repo?: string, sourcePath?: string | null) {
  if (!src) {
    return "";
  }

  const trimmed = src.trim();

  if (isUnsafeUrl(trimmed)) {
    return "";
  }

  if (/^https?:/i.test(trimmed)) {
    return trimmed;
  }

  if (!owner || !repo) {
    return "";
  }

  const repoPath = normalizeRelativePath(trimmed, sourcePath);
  return `/api/repositories/${owner}/${repo}/raw/${encodeRepoPath(repoPath)}`;
}

function looksLikeImageTag(value: string) {
  const input = value.trimStart();
  if (!input.toLowerCase().startsWith("<img")) {
    return false;
  }

  const next = input[4];
  return next === undefined || /\s|\/|>/u.test(next);
}

function readHtmlImageTag(value: string) {
  const input = value.trim();

  if (!looksLikeImageTag(input)) {
    return null;
  }

  let index = 4;
  const attributes = new Map<string, string>();

  while (index < input.length) {
    while (/\s/u.test(input[index] || "")) {
      index += 1;
    }

    const char = input[index];

    if (char === ">") {
      index += 1;
      break;
    }

    if (char === "/" && input[index + 1] === ">") {
      index += 2;
      break;
    }

    const nameStart = index;
    while (/[a-zA-Z0-9:_-]/u.test(input[index] || "")) {
      index += 1;
    }

    if (nameStart === index) {
      return null;
    }

    const name = input.slice(nameStart, index).toLowerCase();

    while (/\s/u.test(input[index] || "")) {
      index += 1;
    }

    let attrValue = "";

    if (input[index] === "=") {
      index += 1;

      while (/\s/u.test(input[index] || "")) {
        index += 1;
      }

      const quote = input[index];

      if (quote === '"' || quote === "'") {
        index += 1;
        const valueStart = index;
        while (index < input.length && input[index] !== quote) {
          index += 1;
        }

        if (input[index] !== quote) {
          return null;
        }

        attrValue = input.slice(valueStart, index);
        index += 1;
      } else {
        const valueStart = index;
        while (index < input.length && !/\s|\/|>/u.test(input[index] || "")) {
          index += 1;
        }
        attrValue = input.slice(valueStart, index);
      }
    }

    if (name.startsWith("on")) {
      return null;
    }

    attributes.set(name, attrValue);
  }

  if (input.slice(index).trim()) {
    return null;
  }

  const src = attributes.get("src")?.trim();

  if (!src || isUnsafeUrl(src)) {
    return null;
  }

  return {
    src,
    alt: attributes.get("alt") || "image",
  };
}

function remarkSafeHtmlImages() {
  return (tree: Root) => {
    visit(tree, "html", (node: Html, index, parent) => {
      if (typeof index !== "number" || !parent || !looksLikeImageTag(node.value)) {
        return;
      }

      const image = readHtmlImageTag(node.value);

      if (!image) {
        parent.children.splice(index, 1);
        return;
      }

      parent.children[index] = {
        type: "image",
        url: image.src,
        alt: image.alt,
      } satisfies Image;
    });
  };
}

function textFromNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(textFromNode).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textFromNode(node.props.children);
  }

  return "";
}

function stripAlertMarker(node: ReactNode, marker: string): ReactNode {
  if (typeof node === "string") {
    return node.replace(marker, "").replace(/^\s+/, "");
  }

  if (Array.isArray(node)) {
    let stripped = false;
    return node.map((child) => {
      if (stripped) {
        return child;
      }

      const next = stripAlertMarker(child, marker);
      if (textFromNode(child) !== textFromNode(next)) {
        stripped = true;
      }

      return next;
    });
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return cloneElement(node, {
      children: stripAlertMarker(node.props.children, marker),
    });
  }

  return node;
}

function alertInfo(children: ReactNode) {
  const text = textFromNode(children).trimStart();
  const match = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);

  if (!match) {
    return null;
  }

  const marker = match[0];
  const title = match[1].toUpperCase();
  const items = Children.toArray(children);
  const first = items[0];

  if (isValidElement<{ children?: ReactNode }>(first)) {
    const strippedFirst = cloneElement(first, {
      children: stripAlertMarker(first.props.children, marker),
    });

    return {
      title,
      children: [strippedFirst, ...items.slice(1)],
    };
  }

  return {
    title,
    children: <p className="mb-4 min-w-0 break-words [overflow-wrap:anywhere]">{text.replace(marker, "").trimStart()}</p>,
  };
}

export function MarkdownRenderer({ content, empty = "", owner, repo, sourcePath, allowHtmlImages = false }: MarkdownRendererProps) {
  if (!content) {
    return <p className="text-sm text-faint">{empty}</p>;
  }

  return (
    <div className="mf-markdown max-w-none text-sm leading-7 text-secondary">
      <ReactMarkdown
        remarkPlugins={allowHtmlImages ? [remarkGfm, remarkSafeHtmlImages] : [remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mb-4 border-b border-line pb-3 text-2xl font-semibold text-foreground">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-6 text-xl font-semibold text-foreground">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-5 text-lg font-semibold text-foreground">{children}</h3>,
          h4: ({ children }) => <h4 className="mb-2 mt-4 text-base font-semibold text-foreground">{children}</h4>,
          p: ({ children }) => <p className="mb-4 min-w-0 break-words [overflow-wrap:anywhere]">{children}</p>,
          a: ({ children, href }) => {
            const resolvedHref = safeHref(href, owner, repo, sourcePath);
            const external = isExternalUrl(resolvedHref);

            return (
            <a className="break-words text-foreground underline underline-offset-4 [overflow-wrap:anywhere]" href={resolvedHref} rel={external ? "noopener noreferrer" : undefined} target={external ? "_blank" : undefined}>
              {children}
            </a>
            );
          },
          img: ({ src, alt }) => {
            const resolvedSrc = safeImageSrc(typeof src === "string" ? src : undefined, owner, repo, sourcePath);

            if (!resolvedSrc) {
              return null;
            }

            return <img alt={alt || ""} className="my-4 h-auto w-auto max-h-[460px] max-w-full rounded-md border border-line object-contain" loading="lazy" src={resolvedSrc} />;
          },
          code: ({ children }) => <code className="rounded-sm border border-line bg-subtle px-1 py-0.5 font-mono text-xs text-foreground">{children}</code>,
          pre: ({ children }) => <pre className="mb-4 overflow-x-auto whitespace-pre rounded-md border border-line bg-subtle p-3 font-mono text-xs text-foreground">{children}</pre>,
          blockquote: ({ children }) => {
            const alert = alertInfo(children);

            if (alert) {
              return (
                <div className="mb-4 rounded-md border border-lineStrong bg-subtle px-4 py-3">
                  <p className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-foreground">{alert.title}</p>
                  <div className="text-secondary">{alert.children}</div>
                </div>
              );
            }

            return <blockquote className="mb-4 border-l-2 border-lineStrong pl-3 text-secondary">{children}</blockquote>;
          },
          table: ({ children }) => (
            <div className="mb-4 overflow-auto">
              <table className="w-full border-collapse border border-line text-left">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-line bg-subtle px-2 py-1 font-medium text-foreground">{children}</th>,
          td: ({ children }) => <td className="border border-line px-2 py-1">{children}</td>,
          ul: ({ children }) => <ul className="mb-4 min-w-0 list-disc pl-5 break-words [overflow-wrap:anywhere]">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 min-w-0 list-decimal pl-5 break-words [overflow-wrap:anywhere]">{children}</ol>,
          hr: () => <hr className="my-6 border-line" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
