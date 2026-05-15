import Link from "next/link";
import { LocalizedText } from "@/components/system/localized-text";

const sections = [
  ["rules.contentTitle", "rules.contentText"],
  ["rules.limitsTitle", "rules.limitsText"],
  ["rules.publicTitle", "rules.publicText"],
  ["rules.behaviorTitle", "rules.behaviorText"],
  ["rules.safetyTitle", "rules.safetyText"],
];

export default function RulesPage() {
  return (
    <section className="grid w-full max-w-4xl gap-8">
      <header className="border-b border-line pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
          <LocalizedText path="rules.eyebrow" />
        </p>
        <h1 className="mt-3 text-3xl font-semibold md:text-5xl">
          <LocalizedText path="rules.title" />
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-secondary">
          <LocalizedText path="rules.intro" />
        </p>
      </header>

      <div className="grid gap-4">
        {sections.map(([title, text]) => (
          <article className="rounded-lg border border-line bg-surface p-5 md:p-6" key={title}>
            <h2 className="text-xl font-semibold">
              <LocalizedText path={title} />
            </h2>
            <p className="mt-3 leading-7 text-secondary">
              <LocalizedText path={text} />
            </p>
          </article>
        ))}
      </div>

      <div className="border-t border-line pt-6">
        <Link className="inline-flex h-10 items-center rounded-md border border-line bg-surface px-4 text-sm font-medium hover:border-lineStrong hover:bg-subtle" href="/docs">
          <LocalizedText path="nav.docs" />
        </Link>
      </div>
    </section>
  );
}
