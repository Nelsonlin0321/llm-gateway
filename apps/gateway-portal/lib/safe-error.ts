/** Log the real error and return a stable client-facing message. */
export function publicMutationError(fallback: string, error: unknown): string {
  console.error(fallback, error);
  return fallback;
}
