import { Readable } from "node:stream";
import { getEnv } from "@/lib/env";

const apiBase = "https://api.github.com";
const apiVersion = "2022-11-28";
const requestTimeoutMs = 15_000;
const tarballTimeoutMs = 120_000;

export type RateBudget = {
  remaining: number | null;
  resetAt: number | null;
};

export type GithubListItem = {
  id: number;
  fullName: string;
  ownerLogin: string;
  name: string;
  fork: boolean;
  isPrivate: boolean;
};

export type GithubRepository = {
  id: number;
  fullName: string;
  name: string;
  ownerLogin: string;
  defaultBranch: string;
  sizeKb: number;
  fork: boolean;
  isPrivate: boolean;
  archived: boolean;
  disabled: boolean;
  description: string | null;
  licenseSpdxId: string | null;
  htmlUrl: string;
};

export class RateLimitExhaustedError extends Error {
  readonly resetAt: number | null;

  constructor(resetAt: number | null) {
    super("GitHub rate limit exhausted");
    this.name = "RateLimitExhaustedError";
    this.resetAt = resetAt;
  }
}

function buildHeaders() {
  const env = getEnv();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": env.GITHUB_API_USER_AGENT,
    "X-GitHub-Api-Version": apiVersion,
  };

  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }

  return headers;
}

function readRate(response: Response): RateBudget {
  const remainingHeader = response.headers.get("x-ratelimit-remaining");
  const resetHeader = response.headers.get("x-ratelimit-reset");
  const remaining = remainingHeader === null ? null : Number(remainingHeader);
  const reset = resetHeader === null ? null : Number(resetHeader) * 1000;

  return {
    remaining: Number.isFinite(remaining) ? remaining : null,
    resetAt: Number.isFinite(reset) ? reset : null,
  };
}

async function githubFetch(path: string) {
  const response = await fetch(`${apiBase}${path}`, {
    headers: buildHeaders(),
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  const rate = readRate(response);

  if (response.status === 403 && rate.remaining === 0) {
    throw new RateLimitExhaustedError(rate.resetAt);
  }

  return { response, rate };
}

export async function listPublicRepositoriesSince(cursor: number): Promise<{ items: GithubListItem[]; rate: RateBudget }> {
  const { response, rate } = await githubFetch(`/repositories?since=${cursor}`);

  if (!response.ok) {
    throw new Error(`GitHub list failed with status ${response.status}`);
  }

  const body = (await response.json()) as Array<{
    id: number;
    full_name: string;
    name: string;
    owner: { login: string } | null;
    fork: boolean;
    private: boolean;
  }>;

  const items = body.map((item) => ({
    id: item.id,
    fullName: item.full_name,
    ownerLogin: item.owner?.login || item.full_name.split("/")[0] || "",
    name: item.name,
    fork: Boolean(item.fork),
    isPrivate: Boolean(item.private),
  }));

  return { items, rate };
}

export async function getRepository(owner: string, repo: string): Promise<{ repository: GithubRepository | null; rate: RateBudget }> {
  const { response, rate } = await githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);

  if (response.status === 404) {
    return { repository: null, rate };
  }

  if (!response.ok) {
    throw new Error(`GitHub repository fetch failed with status ${response.status}`);
  }

  const body = (await response.json()) as {
    id: number;
    full_name: string;
    name: string;
    owner: { login: string } | null;
    default_branch: string;
    size: number;
    fork: boolean;
    private: boolean;
    archived: boolean;
    disabled: boolean;
    description: string | null;
    html_url: string;
    license: { spdx_id: string | null } | null;
  };

  return {
    repository: {
      id: body.id,
      fullName: body.full_name,
      name: body.name,
      ownerLogin: body.owner?.login || owner,
      defaultBranch: body.default_branch || "main",
      sizeKb: body.size || 0,
      fork: Boolean(body.fork),
      isPrivate: Boolean(body.private),
      archived: Boolean(body.archived),
      disabled: Boolean(body.disabled),
      description: body.description,
      licenseSpdxId: body.license?.spdx_id ?? null,
      htmlUrl: body.html_url,
    },
    rate,
  };
}

export async function downloadTarball(owner: string, repo: string, ref: string): Promise<Readable> {
  const response = await fetch(`${apiBase}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tarball/${encodeURIComponent(ref)}`, {
    headers: buildHeaders(),
    redirect: "follow",
    signal: AbortSignal.timeout(tarballTimeoutMs),
  });

  if (!response.ok || !response.body) {
    throw new Error(`GitHub tarball download failed with status ${response.status}`);
  }

  return Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]);
}
