import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { LocalizedText } from "@/components/system/localized-text";
import { registerAction } from "@/lib/auth/actions";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <section className="mx-auto grid max-w-md gap-6 py-10">
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
        <AuthForm mode="register" action={registerAction} />
      </div>
      <p className="text-sm text-secondary">
        <LocalizedText path="auth.alreadyRegistered" />{" "}
        <Link className="text-foreground underline underline-offset-4" href="/login">
          <LocalizedText path="nav.login" />
        </Link>
      </p>
    </section>
  );
}
