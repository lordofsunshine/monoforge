export type SearchScope = "global" | "repo";

export type SearchKind = "repository" | "user" | "issue" | "file";

export type SearchResultItem = {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle?: string;
  href: string;
  meta?: Record<string, string | number | boolean | null>;
};

export type SearchResultGroups = {
  repositories: SearchResultItem[];
  users: SearchResultItem[];
  issues: SearchResultItem[];
  files: SearchResultItem[];
};

export type SearchResponse = {
  query: string;
  scope: SearchScope;
  limit: number;
  offset: number;
  total: number;
  results: SearchResultGroups;
};
