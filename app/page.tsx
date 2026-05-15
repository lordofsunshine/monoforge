import Link from "next/link";
import { PublicRepositorySearch } from "@/components/search/public-repository-search";
import { LocalizedText } from "@/components/system/localized-text";

export default function HomePage() {
  return (
    <section className="grid overflow-hidden">
      <div className="relative grid min-h-[calc(100dvh-8rem)] content-center gap-8 overflow-hidden rounded-b-lg border-b border-line py-10 md:py-14">
        <div className="absolute inset-0 -z-30 bg-[url('/hero.png')] bg-cover bg-center opacity-[0.34] grayscale dark:opacity-[0.32]" />
        <div className="absolute inset-0 -z-20 bg-gradient-to-b from-background/62 via-background/78 to-background" />
        <div className="mf-grid-glow absolute inset-0 -z-10 opacity-50" />
        <div className="max-w-4xl">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
            <LocalizedText path="home.eyebrow" />
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-normal md:text-6xl xl:text-7xl">
            <LocalizedText path="home.title" />
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-secondary md:text-lg">
            <LocalizedText path="home.description" />
          </p>
          <p className="mt-4 max-w-xl text-sm leading-6 text-secondary">
            <LocalizedText path="home.openSource" />{" "}
            <a className="text-foreground underline underline-offset-4 hover:text-secondary" href="https://github.com/lordofsunshine/monoforge" target="_blank" rel="noopener noreferrer">
              <LocalizedText path="home.githubLink" />
            </a>
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="mf-primary inline-flex h-11 items-center rounded-md border px-5 text-sm font-medium" href="/register">
              <LocalizedText path="home.createAccount" />
            </Link>
            <Link className="inline-flex h-11 items-center rounded-md border border-line bg-surface/90 px-5 text-sm font-medium hover:border-lineStrong hover:bg-subtle" href="/docs">
              <LocalizedText path="nav.docs" />
            </Link>
          </div>
        </div>
        <div className="grid gap-4 border-t border-line pt-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
              <LocalizedText path="home.searchTitle" />
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
              <LocalizedText path="home.searchText" />
            </p>
          </div>
          <div className="font-mono text-xs text-faint lg:justify-self-end">
            <div className="flex flex-wrap gap-2">
              {["home.stripOne", "home.stripTwo", "home.stripThree", "home.stripFour", "home.stripFive"].map((item) => (
                <span className="rounded-full border border-line bg-surface/85 px-3 py-1" key={item}>
                  <LocalizedText path={item} />
                </span>
              ))}
            </div>
          </div>
        </div>
        <PublicRepositorySearch />
      </div>

      <div className="grid gap-0 border-b border-line md:grid-cols-3">
        {[
          ["home.featureOneTitle", "home.featureOneText"],
          ["home.featureTwoTitle", "home.featureTwoText"],
          ["home.featureThreeTitle", "home.featureThreeText"],
        ].map(([title, text]) => (
          <article className="border-t border-line py-6 md:border-r md:px-6 md:last:border-r-0" key={title}>
            <h2 className="text-lg font-semibold">
              <LocalizedText path={title} />
            </h2>
            <p className="mt-3 text-sm leading-6 text-secondary">
              <LocalizedText path={text} />
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
