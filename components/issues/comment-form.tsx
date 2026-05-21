"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { IssueFormState } from "@/lib/issues/actions";
import { useI18n } from "@/components/system/preferences-provider";
import { translateMessage } from "@/lib/i18n/messages";

type CommentFormProps = {
  action: (state: IssueFormState, formData: FormData) => Promise<IssueFormState>;
};

const initialState: IssueFormState = {
  ok: false,
  message: "",
};

export function CommentForm({ action }: CommentFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.ok]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3">
      <textarea className="min-h-28 rounded-md border border-line bg-surface px-3 py-2 text-sm leading-6 outline-none hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20" name="body" placeholder={t("issuesPage.commentPlaceholder")} required />
      {state.message ? <p className="rounded-md border border-line bg-subtle px-3 py-2 text-sm text-secondary">{translateMessage(t, state.message)}</p> : null}
      <div>
        <button className="inline-flex h-9 items-center justify-center rounded-md border border-line bg-surface px-3 text-sm hover:border-lineStrong hover:bg-subtle disabled:opacity-40" disabled={pending} type="submit">
          {pending ? t("issuesPage.adding") : t("issuesPage.addComment")}
        </button>
      </div>
    </form>
  );
}
