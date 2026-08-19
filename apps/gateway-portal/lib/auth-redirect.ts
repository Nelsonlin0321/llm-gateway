export function safeReturnPath(
  next: string | null | undefined,
  fallback = "/workspace",
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  return next;
}
