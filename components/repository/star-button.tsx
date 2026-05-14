"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useI18n } from "@/components/system/preferences-provider";

type StarButtonProps = {
  owner: string;
  repo: string;
  starred: boolean;
  starCount: number;
};

type StarState = {
  starred: boolean;
  starCount: number;
};

export function StarButton({ owner, repo, starred, starCount }: StarButtonProps) {
  const { t } = useI18n();
  const [state, setState] = useState<StarState>({ starred, starCount });
  const [optimisticState, setOptimisticState] = useOptimistic(state, (_current, next: StarState) => next);
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-surface px-3 font-mono text-xs hover:border-lineStrong hover:bg-subtle disabled:opacity-50"
      disabled={pending}
      onClick={() => {
        const nextStarred = !optimisticState.starred;
        const nextState = {
          starred: nextStarred,
          starCount: Math.max(0, optimisticState.starCount + (nextStarred ? 1 : -1)),
        };

        startTransition(async () => {
          setOptimisticState(nextState);

          const response = await fetch(`/api/repositories/${owner}/${repo}/stars`, {
            method: nextStarred ? "POST" : "DELETE",
            headers: { Accept: "application/json" },
          });

          if (!response.ok) {
            return;
          }

          const body = (await response.json()) as StarState;
          setState({
            starred: body.starred,
            starCount: body.starCount,
          });
        });
      }}
      type="button"
      aria-pressed={optimisticState.starred}
      aria-label={optimisticState.starred ? t("repo.unstarRepo") : t("repo.starRepo")}
    >
      <span>{optimisticState.starred ? t("repo.starred") : t("repo.star")}</span>
      <span className="text-faint">{optimisticState.starCount}</span>
    </button>
  );
}
