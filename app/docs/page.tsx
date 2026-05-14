import Link from "next/link";
import { LocalizedText } from "@/components/system/localized-text";

const sections = [
  ["docs.createTitle", "docs.createText"],
  ["docs.uploadTitle", "docs.uploadText"],
  ["docs.readmeTitle", "docs.readmeText"],
  ["docs.issuesTitle", "docs.issuesText"],
  ["docs.searchTitle", "docs.searchText"],
  ["docs.privacyTitle", "docs.privacyText"],
];

export default function DocsPage() {
  return (
    <section className="mx-auto grid max-w-4xl gap-8">
      <header className="border-b border-line pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
          <LocalizedText path="docs.eyebrow" />
        </p>
        <h1 className="mt-3 text-3xl font-semibold md:text-5xl">
          <LocalizedText path="docs.title" />
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-secondary">
          <LocalizedText path="docs.intro" />
        </p>
      </header>

      <div className="grid gap-4">
        {sections.map(([title, text], index) => (
          <article className="rounded-lg border border-line bg-surface p-5 md:p-6" key={title}>
            <p className="font-mono text-xs text-faint">{String(index + 1).padStart(2, "0")}</p>
            <h2 className="mt-3 text-xl font-semibold">
              <LocalizedText path={title} />
            </h2>
            <p className="mt-3 leading-7 text-secondary">
              <LocalizedText path={text} />
            </p>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-line pt-6">
        <Link className="mf-primary inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium" href="/new">
          <LocalizedText path="dashboard.newRepo" />
        </Link>
        <Link className="inline-flex h-10 items-center rounded-md border border-line bg-surface px-4 text-sm font-medium hover:border-lineStrong hover:bg-subtle" href="/">
          <LocalizedText path="search.repositories" />
        </Link>
      </div>
    </section>
  );
}
