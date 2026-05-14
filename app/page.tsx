import Link from "next/link";
import { PublicRepositorySearch } from "@/components/search/public-repository-search";
import { LocalizedText } from "@/components/system/localized-text";

export default function HomePage() {
  return (
    <section className="grid gap-10 overflow-hidden">
      <div className="relative grid min-h-[calc(100dvh-8rem)] content-center gap-10 overflow-hidden rounded-b-lg border-b border-line py-10 md:py-14">
        <div className="absolute inset-0 -z-20 bg-[url('/hero.png')] bg-cover bg-center opacity-[0.14] grayscale dark:opacity-[0.18]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/80 via-background/88 to-background" />
        <div className="mf-grid-glow absolute inset-0 -z-10" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_360px] lg:items-center lg:gap-16">
          <div>
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
              <Link className="inline-flex h-11 items-center rounded-md border border-line bg-surface px-5 text-sm font-medium hover:border-lineStrong hover:bg-subtle" href="/docs">
                <LocalizedText path="nav.docs" />
              </Link>
            </div>
          </div>
          <div className="mf-pulse-card rounded-lg border border-line bg-surface p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-line pb-3 font-mono text-xs text-faint">
              <span>MONOFORGE</span>
              <span>PUBLIC</span>
            </div>
            <div className="grid gap-2 font-mono text-xs">
              {["repo:init", "folder:upload", "readme:preview", "issues:open", "zip:download"].map((item, index) => (
                <div className="flex items-center justify-between rounded-md border border-line bg-background px-3 py-2" key={item}>
                  <span>{item}</span>
                  <span className="text-faint">{String(index + 1).padStart(2, "0")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
              <LocalizedText path="home.searchTitle" />
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
              <LocalizedText path="home.searchText" />
            </p>
          </div>
          <div className="font-mono text-xs text-faint">
            <div className="flex flex-wrap gap-2">
              {["home.stripOne", "home.stripTwo", "home.stripThree", "home.stripFour", "home.stripFive"].map((item) => (
                <span className="rounded-full border border-line bg-surface px-3 py-1" key={item}>
                  <LocalizedText path={item} />
                </span>
              ))}
            </div>
          </div>
        </div>
        <PublicRepositorySearch />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["home.featureOneTitle", "home.featureOneText"],
          ["home.featureTwoTitle", "home.featureTwoText"],
          ["home.featureThreeTitle", "home.featureThreeText"],
        ].map(([title, text]) => (
          <article className="rounded-lg border border-line bg-surface p-5" key={title}>
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
