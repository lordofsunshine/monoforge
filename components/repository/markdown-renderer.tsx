import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

function markdownWithSafeImages(content: string) {
  return content.replace(/<img\s+([^>]*?)\/?>/gi, (_match, attributes: string) => {
    if (/\son[a-z]+\s*=/i.test(attributes)) {
      return _match;
    }

    const src = /src\s*=\s*["']([^"']+)["']/i.exec(attributes)?.[1];
    const alt = /alt\s*=\s*["']([^"']*)["']/i.exec(attributes)?.[1] || "image";

    if (!src) {
      return "";
    }

    return `![${alt.replaceAll("[", "").replaceAll("]", "")}](${src})`;
  });
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

export function MarkdownRenderer({ content, empty = "", owner, repo, sourcePath, allowHtmlImages = false }: MarkdownRendererProps) {
  if (!content) {
    return <p className="text-sm text-faint">{empty}</p>;
  }

  const safeContent = allowHtmlImages ? markdownWithSafeImages(content) : content;

  return (
    <div className="mf-markdown max-w-none text-sm leading-7 text-secondary">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
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
          blockquote: ({ children }) => <blockquote className="mb-4 border-l-2 border-lineStrong pl-3 text-secondary">{children}</blockquote>,
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
        {safeContent}
      </ReactMarkdown>
    </div>
  );
}
