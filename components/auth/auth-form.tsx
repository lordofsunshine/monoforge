"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/auth/actions";
import { useI18n } from "@/components/system/preferences-provider";
import { translateMessage } from "@/lib/i18n/messages";

type AuthFormProps = {
  mode: "login" | "register";
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  googleEnabled?: boolean;
  googleAction?: () => Promise<void>;
};

const initialState: FormState = {
  ok: false,
  message: "",
};

export function AuthForm({ mode, action, googleEnabled = false, googleAction }: AuthFormProps) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(action, initialState);
  const isRegister = mode === "register";

  return (
    <div className="grid gap-4">
      {googleEnabled && googleAction ? (
        <>
          <form action={googleAction}>
            <button className="inline-flex h-10 w-full items-center justify-center rounded-md border border-line bg-surface px-4 text-sm font-medium hover:border-lineStrong hover:bg-subtle" type="submit">
              {t("auth.continueWithGoogle")}
            </button>
          </form>
          <div className="flex items-center gap-3 text-xs text-faint">
            <span className="h-px flex-1 bg-line" />
            <span>{t("auth.or")}</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      ) : null}
      <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <label className="font-mono text-xs uppercase tracking-[0.12em] text-secondary" htmlFor="email">
          {t("auth.email")}
        </label>
        <input
          className="h-10 rounded-md border border-line bg-surface px-3 text-sm outline-none placeholder:text-faint hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      {isRegister ? (
        <div className="grid gap-2">
          <label className="font-mono text-xs uppercase tracking-[0.12em] text-secondary" htmlFor="username">
            {t("auth.username")}
          </label>
          <input
            className="h-10 rounded-md border border-line bg-surface px-3 font-mono text-sm lowercase outline-none placeholder:text-faint hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20"
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            minLength={3}
            maxLength={32}
            required
          />
          <p className="text-xs leading-5 text-faint">{t("auth.usernameHint")}</p>
        </div>
      ) : null}
      <div className="grid gap-2">
        <label className="font-mono text-xs uppercase tracking-[0.12em] text-secondary" htmlFor="password">
          {t("auth.password")}
        </label>
        <input
          className="h-10 rounded-md border border-line bg-surface px-3 text-sm outline-none placeholder:text-faint hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20"
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={isRegister ? 8 : 1}
          required
        />
      </div>
      {state.message ? (
        <p className="rounded-md border border-line bg-subtle px-3 py-2 text-sm text-secondary" role="status">
          {translateMessage(t, state.message)}
        </p>
      ) : null}
      <button
        className="mf-primary inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium disabled:opacity-40"
        type="submit"
        disabled={pending}
      >
        {pending ? t("auth.working") : isRegister ? t("auth.createAccount") : t("auth.login")}
      </button>
      </form>
    </div>
  );
}
