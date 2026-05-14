"use client";

import { useActionState } from "react";
import { updateProfileAction, type FormState } from "@/lib/auth/actions";
import { useI18n } from "@/components/system/preferences-provider";

type ProfileFormProps = {
  username: string;
  bio: string;
  image: string;
};

const initialState: FormState = {
  ok: false,
  message: "",
};

export function ProfileForm({ username, bio, image }: ProfileFormProps) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-2">
        <label className="font-mono text-xs uppercase tracking-[0.12em] text-secondary" htmlFor="username">
          {t("settings.username")}
        </label>
        <input
          className="h-10 rounded-md border border-line bg-surface px-3 font-mono text-sm lowercase outline-none hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20"
          id="username"
          name="username"
          defaultValue={username}
          minLength={3}
          maxLength={32}
          required
        />
      </div>
      <div className="grid gap-2">
        <label className="font-mono text-xs uppercase tracking-[0.12em] text-secondary" htmlFor="image">
          {t("settings.avatarUrl")}
        </label>
        <input
          className="h-10 rounded-md border border-line bg-surface px-3 text-sm outline-none hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20"
          id="image"
          name="image"
          type="url"
          defaultValue={image}
          placeholder="https://..."
        />
      </div>
      <div className="grid gap-2">
        <label className="font-mono text-xs uppercase tracking-[0.12em] text-secondary" htmlFor="bio">
          {t("settings.bio")}
        </label>
        <textarea
          className="min-h-28 resize-y rounded-md border border-line bg-surface px-3 py-2 text-sm leading-6 outline-none hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20"
          id="bio"
          name="bio"
          defaultValue={bio}
          maxLength={240}
        />
      </div>
      {state.message ? (
        <p className="rounded-md border border-line bg-subtle px-3 py-2 text-sm text-secondary" role="status">
          {state.message}
        </p>
      ) : null}
      <div>
        <button
          className="mf-primary inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium disabled:opacity-40"
          type="submit"
          disabled={pending}
        >
          {pending ? t("settings.saving") : t("settings.saveProfile")}
        </button>
      </div>
    </form>
  );
}
