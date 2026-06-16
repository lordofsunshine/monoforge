import Image from "next/image";
import Link from "next/link";
import { LocalizedText } from "@/components/system/localized-text";

export function HomeFooter() {
  return (
    <footer className="mt-8 border-t border-line">
      <div className="flex flex-wrap items-center justify-between gap-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2.5 font-mono text-sm font-semibold tracking-normal">
          <Image src="/favicon.ico" alt="" width={26} height={26} className="h-[1.6rem] w-[1.6rem] rounded-[0.4rem] object-contain" aria-hidden />
          MonoForge
        </Link>
        <nav className="flex flex-wrap gap-5 text-sm text-secondary">
          <Link href="/explore" className="hover:text-foreground">
            <LocalizedText path="nav.explore" />
          </Link>
          <Link href="/docs" className="hover:text-foreground">
            <LocalizedText path="nav.docs" />
          </Link>
          <Link href="/lordofsunshine/monoforge" className="hover:text-foreground">
            <LocalizedText path="footer.repository" />
          </Link>
          <Link href="/rules" className="hover:text-foreground">
            <LocalizedText path="nav.rules" />
          </Link>
        </nav>
        <small className="font-mono text-xs text-faint">
          <LocalizedText path="footer.copyright" />
        </small>
      </div>
    </footer>
  );
}
