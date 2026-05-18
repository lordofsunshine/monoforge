import Link from "next/link";
import { PublicRepositorySearch } from "@/components/search/public-repository-search";
import { LocalizedText } from "@/components/system/localized-text";

const chips = ["home.stripOne", "home.stripTwo", "home.stripThree", "home.stripFour", "home.stripFive"];

const features = [
  ["home.featureOneTitle", "home.featureOneText", "upload"],
  ["home.featureTwoTitle", "home.featureTwoText", "file"],
  ["home.featureThreeTitle", "home.featureThreeText", "chat"],
];

function FeatureIcon({ type }: { type: string }) {
  if (type === "upload") {
    return (
      <span className="relative block h-7 w-7">
        <span className="absolute bottom-0 left-1 h-3 w-5 rounded-sm border border-current" />
        <span className="absolute left-1/2 top-0 h-5 border-l border-current" />
        <span className="absolute left-[9px] top-0 h-3 w-3 rotate-45 border-l border-t border-current" />
      </span>
    );
  }

  if (type === "file") {
    return (
      <span className="relative block h-7 w-6 rounded-sm border border-current">
        <span className="absolute right-0 top-0 h-2 w-2 border-b border-l border-current" />
        <span className="absolute left-1.5 top-3 h-px w-3 bg-current" />
        <span className="absolute left-1.5 top-[18px] h-px w-3 bg-current" />
      </span>
    );
  }

  return (
    <span className="relative block h-7 w-7 rounded-sm border border-current">
      <span className="absolute bottom-[-5px] left-2 h-2 w-2 rotate-45 border-b border-r border-current bg-surface" />
      <span className="absolute left-1.5 top-2.5 h-px w-4 bg-current" />
      <span className="absolute left-1.5 top-4 h-px w-3 bg-current" />
    </span>
  );
}

export default function HomePage() {
  return (
    <section className="mf-landing -mx-5 overflow-hidden pb-10 md:-mx-6 xl:mx-0">
      <div className="relative min-h-[calc(100dvh-7rem)] overflow-hidden rounded-b-[2rem] bg-background px-5 pt-4 md:px-6 lg:px-7 xl:px-0">
        <div className="pointer-events-none absolute inset-y-0 right-0 top-8 hidden w-[58%] lg:block">
          <div className="absolute inset-0 bg-[url('/hero.png')] bg-cover bg-center opacity-[0.58] grayscale contrast-125 brightness-105 dark:opacity-100 dark:brightness-[1.85] dark:contrast-[1.65]" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/42 to-background/8 dark:via-background/8 dark:to-background/0" />
          <div className="mf-grid-glow absolute inset-0 opacity-45 dark:opacity-90" />
        </div>
        <div className="relative z-10 grid gap-0 pt-6 lg:pt-9">
          <div className="grid min-h-[360px] items-center lg:grid-cols-[minmax(0,720px)_1fr]">
            <div>
              <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.16em] text-secondary">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-subtle">
                  <span className="h-2.5 w-2.5 rounded-full bg-foreground" />
                </span>
                <LocalizedText path="home.eyebrow" />
              </p>
              <h1 className="mt-7 max-w-[740px] text-[clamp(2.75rem,4.3vw,4rem)] font-semibold leading-[1.02] tracking-normal text-foreground">
                <LocalizedText path="home.title" />
              </h1>
              <p className="mt-7 max-w-[690px] text-[1.12rem] leading-[1.45] text-secondary">
                <LocalizedText path="home.description" />
              </p>
              <p className="mt-5 max-w-[730px] text-base leading-7 text-secondary">
                <LocalizedText path="home.openSource" />{" "}
                <a className="text-foreground hover:text-secondary" href="https://github.com/lordofsunshine/monoforge" target="_blank" rel="noopener noreferrer">
                  <LocalizedText path="home.githubLink" />
                </a>
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link className="mf-primary inline-flex h-[52px] min-w-40 items-center justify-center rounded-md border px-7 font-medium shadow-lg shadow-black/10" href="/register">
                  <LocalizedText path="home.createAccount" />
                </Link>
                <Link className="inline-flex h-[52px] min-w-40 items-center justify-center rounded-md border border-line bg-surface/90 px-7 font-medium shadow-sm hover:border-lineStrong hover:bg-subtle" href="/docs">
                  <LocalizedText path="nav.docs" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-2xl border border-line bg-surface/[0.94] px-7 pb-10 pt-7 shadow-2xl shadow-black/[0.08] backdrop-blur md:px-8 md:pb-11 md:pt-8">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div>
                <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-secondary">
                  <LocalizedText path="home.searchTitle" />
                </h2>
                <p className="mt-3 max-w-[720px] text-base leading-7 text-secondary">
                  <LocalizedText path="home.searchText" />
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:max-w-[700px] lg:justify-end">
                {chips.map((item) => (
                  <span className="rounded-full border border-line bg-background px-4 py-2 text-sm text-secondary" key={item}>
                    <LocalizedText path={item} />
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-7">
              <PublicRepositorySearch compact />
            </div>
          </div>

          <div className="mt-10 grid overflow-hidden rounded-2xl border border-line bg-surface/70 md:grid-cols-3">
            {features.map(([title, text, icon]) => (
              <article className="grid gap-5 border-b border-line px-7 py-9 last:border-b-0 md:grid-cols-[72px_1fr] md:border-b-0 md:border-r md:last:border-r-0" key={title}>
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-lg border border-line bg-background text-secondary shadow-sm">
                  <FeatureIcon type={icon} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    <LocalizedText path={title} />
                  </h2>
                  <p className="mt-3 text-base leading-7 text-secondary">
                    <LocalizedText path={text} />
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
