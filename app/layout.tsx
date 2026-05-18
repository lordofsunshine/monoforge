import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { MainNav } from "@/components/layout/main-nav";
import { PreferenceScript } from "@/components/system/preference-script";
import { PreferencesProvider } from "@/components/system/preferences-provider";
import { RouteLineLoader } from "@/components/system/route-line-loader";
import { UserMenu } from "@/components/system/user-menu";
import { isAdminEmail } from "@/lib/admin";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://monoforge.org"),
  applicationName: "MonoForge",
  title: {
    default: "MonoForge - Minimal project hosting",
    template: "%s | MonoForge",
  },
  description: "MonoForge is a quiet monochrome platform for publishing repositories, uploading folders, reading README files, tracking issues and sharing projects.",
  keywords: [
    "MonoForge",
    "project hosting",
    "code hosting",
    "repository hosting",
    "GitHub alternative",
    "minimal developer platform",
    "README preview",
    "issue tracker",
    "file storage",
    "monochrome interface",
  ],
  authors: [{ name: "MonoForge" }],
  creator: "MonoForge",
  publisher: "MonoForge",
  category: "technology",
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      ru: "/",
    },
  },
  openGraph: {
    type: "website",
    url: "https://monoforge.org",
    siteName: "MonoForge",
    title: "MonoForge - Minimal project hosting",
    description: "Publish repositories, upload folders, read README files, track issues and share projects in a calm monochrome workspace.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MonoForge",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MonoForge - Minimal project hosting",
    description: "A quiet monochrome space for repositories, files, README pages and issues.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <PreferenceScript />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <PreferencesProvider>
          <RouteLineLoader />
          <header className="sticky top-0 z-40 bg-transparent px-4 py-3">
            <div className="mx-auto flex min-h-20 w-full max-w-[1408px] flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-background/[0.92] py-2 pl-4 pr-4 shadow-2xl shadow-black/[0.08] backdrop-blur md:flex-nowrap md:pr-6 lg:pr-8">
              <Link href="/" className="font-mono text-sm font-semibold tracking-normal">
                MonoForge
              </Link>
              <CommandPalette username={session?.user?.username ?? null} />
              <nav className="flex items-center gap-1 text-sm">
                <MainNav username={session?.user?.username ?? null} />
                <UserMenu username={session?.user?.username ?? null} isAdmin={isAdminEmail(session?.user?.email)} />
                {session?.user ? <SignOutButton /> : null}
              </nav>
            </div>
          </header>
          <main className="mf-container py-8">{children}</main>
        </PreferencesProvider>
      </body>
    </html>
  );
}
