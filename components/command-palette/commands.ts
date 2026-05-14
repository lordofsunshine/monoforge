export type CommandAction = "navigate" | "theme" | "focus";

export type CommandItem = {
  id: string;
  title: string;
  subtitle: string;
  shortcut?: string;
  href?: string;
  action: CommandAction;
  value?: string;
  requiresRepo?: boolean;
  requiresUser?: boolean;
};

export type RepoContext = {
  owner: string;
  repo: string;
};

const systemPrefixes = new Set(["", "api", "dashboard", "docs", "login", "new", "register", "rules", "settings", "u"]);

export function getRepoContext(pathname: string): RepoContext | null {
  const [owner, repo] = pathname.split("/").filter(Boolean);

  if (!owner || !repo || systemPrefixes.has(owner)) {
    return null;
  }

  return { owner, repo };
}

export function getBaseCommands(input: { username?: string | null; repoContext?: RepoContext | null }): CommandItem[] {
  const repoPath = input.repoContext ? `/${input.repoContext.owner}/${input.repoContext.repo}` : "";

  return [
    {
      id: "repo:new",
      title: "Create repository",
      subtitle: "repo:new",
      shortcut: "repo:new",
      href: "/new",
      action: "navigate",
    },
    {
      id: "search:repos",
      title: "Search repositories",
      subtitle: "Type at least two characters",
      action: "navigate",
      href: "/",
    },
    {
      id: "user:me",
      title: "Go to profile",
      subtitle: "user:me",
      shortcut: "user:me",
      href: input.username ? `/u/${input.username}` : "/login",
      action: "navigate",
      requiresUser: true,
    },
    {
      id: "settings:profile",
      title: "Go to settings",
      subtitle: "Profile settings",
      href: "/settings/profile",
      action: "navigate",
      requiresUser: true,
    },
    {
      id: "theme:toggle",
      title: "Toggle theme",
      subtitle: "theme:toggle",
      shortcut: "theme:toggle",
      action: "theme",
    },
    {
      id: "focus:on",
      title: "Focus mode on",
      subtitle: "focus:on",
      shortcut: "focus:on",
      action: "focus",
      value: "on",
    },
    {
      id: "focus:off",
      title: "Focus mode off",
      subtitle: "focus:off",
      shortcut: "focus:off",
      action: "focus",
      value: "off",
    },
    {
      id: "repo:issues",
      title: "Open current repo issues",
      subtitle: input.repoContext ? `${input.repoContext.owner}/${input.repoContext.repo}` : "Repository context required",
      href: repoPath ? `${repoPath}/issues` : undefined,
      action: "navigate",
      requiresRepo: true,
    },
    {
      id: "repo:download-zip",
      title: "Download ZIP",
      subtitle: "Repository archive",
      href: repoPath ? `/api/repositories/${input.repoContext?.owner}/${input.repoContext?.repo}/archive` : undefined,
      action: "navigate",
      requiresRepo: true,
    },
    {
      id: "issue:new",
      title: "New issue",
      subtitle: "issue:new",
      shortcut: "issue:new",
      href: repoPath ? `${repoPath}/issues/new` : undefined,
      action: "navigate",
      requiresRepo: true,
      requiresUser: true,
    },
  ];
}

export function filterCommands(commands: CommandItem[], query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return commands;
  }

  return commands.filter((command) => {
    return (
      command.title.toLowerCase().includes(normalized) ||
      command.subtitle.toLowerCase().includes(normalized) ||
      command.shortcut?.toLowerCase().startsWith(normalized)
    );
  });
}
