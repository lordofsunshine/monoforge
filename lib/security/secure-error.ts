export function toSafeError(error: unknown, fallback = "Request failed") {
  if (error instanceof Error && error.message && !error.message.includes("\n")) {
    return error.message;
  }

  return fallback;
}

export function logServerError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error);
}
