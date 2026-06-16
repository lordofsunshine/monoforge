const minUsernameLength = 3;
const maxUsernameLength = 32;
const fallbackUsername = "user";

export function githubLoginToUsername(login: string) {
  const cleaned = login
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+/, "")
    .replace(/[-_]+$/, "");

  let username = cleaned || fallbackUsername;

  if (username.length > maxUsernameLength) {
    username = username.slice(0, maxUsernameLength).replace(/[-_]+$/, "");
  }

  if (username.length < minUsernameLength) {
    username = username.padEnd(minUsernameLength, "0");
  }

  return username;
}

export function usernameWithSuffix(base: string, attempt: number) {
  if (attempt <= 0) {
    return base;
  }

  const suffix = `-${attempt}`;
  const room = maxUsernameLength - suffix.length;
  const head = base.slice(0, room).replace(/[-_]+$/, "") || fallbackUsername;

  return `${head}${suffix}`;
}
