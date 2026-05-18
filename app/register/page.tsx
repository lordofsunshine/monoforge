import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { LocalizedText } from "@/components/system/localized-text";
import { googleSignInAction, registerAction } from "@/lib/auth/actions";

export default async function RegisterPage() {
  const session = await auth();
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <section className="grid w-full gap-10 py-10 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:items-center lg:py-14">
      <div className="grid gap-6">
        <div className="grid gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
            <LocalizedText path="auth.eyebrow" />
          </p>
          <h1 className="text-2xl font-semibold">
            <LocalizedText path="auth.registerTitle" />
          </h1>
          <p className="text-sm leading-6 text-secondary">
            <LocalizedText path="auth.registerDescription" />
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-5">
          <AuthForm mode="register" action={registerAction} googleEnabled={googleEnabled} googleAction={googleSignInAction} />
        </div>
        <p className="text-sm text-secondary">
          <LocalizedText path="auth.alreadyRegistered" />{" "}
          <Link className="text-foreground underline underline-offset-4" href="/login">
            <LocalizedText path="nav.login" />
          </Link>
        </p>
      </div>
      <div className="relative hidden min-h-[560px] overflow-hidden rounded-2xl bg-surface lg:block">
        <div className="absolute inset-0 bg-[url('/hero.png')] bg-cover bg-center opacity-[0.58] grayscale contrast-125 brightness-105 dark:opacity-100 dark:brightness-[1.85] dark:contrast-[1.65]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/24 to-background/0" />
        <div className="mf-grid-glow absolute inset-0 opacity-55 dark:opacity-80" />
      </div>
    </section>
  );
}
