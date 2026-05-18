import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Markdown } from "@/components/issues/markdown";

describe("issue markdown rendering", () => {
  it("does not render raw script tags", () => {
    const html = renderToStaticMarkup(<Markdown content={'<script>alert("xss")</script>'} />);

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("does not preserve inline event handlers as html", () => {
    const html = renderToStaticMarkup(<Markdown content={'<img src=x onerror="alert(1)" />'} />);

    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("blocks javascript urls", () => {
    const html = renderToStaticMarkup(<Markdown content={"[click](javascript:alert(1))"} />);

    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="#"');
  });

  it("renders GitHub style markdown alerts safely", () => {
    const html = renderToStaticMarkup(<Markdown content={"> [!WARNING]\n> Check this before upload."} />);

    expect(html).toContain("WARNING");
    expect(html).toContain("Check this before upload.");
    expect(html).not.toContain("[!WARNING]");
  });
});
