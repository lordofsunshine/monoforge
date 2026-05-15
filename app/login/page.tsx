import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { LocalizedText } from "@/components/system/localized-text";
import { googleSignInAction, loginAction } from "@/lib/auth/actions";

export default async function LoginPage() {
  const session = await auth();
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <section className="grid w-full max-w-md gap-6 py-10">
      <div className="grid gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
          <LocalizedText path="auth.eyebrow" />
        </p>
        <h1 className="text-2xl font-semibold">
          <LocalizedText path="auth.loginTitle" />
        </h1>
        <p className="text-sm leading-6 text-secondary">
          <LocalizedText path="auth.loginDescription" />
        </p>
      </div>
      <div className="rounded-lg border border-line bg-surface p-5">
        <AuthForm mode="login" action={loginAction} googleEnabled={googleEnabled} googleAction={googleSignInAction} />
      </div>
      <p className="text-sm text-secondary">
        <LocalizedText path="auth.noAccount" />{" "}
        <Link className="text-foreground underline underline-offset-4" href="/register">
          <LocalizedText path="nav.register" />
        </Link>
      </p>
    </section>
  );
}
