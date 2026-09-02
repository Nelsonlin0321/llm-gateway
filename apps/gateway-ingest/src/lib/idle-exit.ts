/**
 * Idle-exit timer for a drain run.
 *
 * When `idleExitMs > 0`, the run should stop once that many milliseconds
 * pass with no events to ingest. Any ingested event resets the deadline
 * to `now + idleExitMs`. `0` disables idle-exit (run until a signal).
 */
export type IdleExitTracker = {
  /** Call when a non-empty batch was read or finished. */
  reset(now?: number): void;
  /** True when idle-exit is enabled and the deadline has been reached. */
  isExpired(now?: number): boolean;
  /**
   * Cap an XREADGROUP BLOCK so the loop re-checks idle-exit on time.
   * Redis BLOCK is omitted when the result is 0 (non-blocking).
   */
  capBlockMs(blockMs: number, now?: number): number;
};

export function createIdleExitTracker(
  idleExitMs: number,
  clock: () => number = Date.now,
): IdleExitTracker {
  let deadline = clock() + idleExitMs;

  return {
    reset(now = clock()) {
      deadline = now + idleExitMs;
    },
    isExpired(now = clock()) {
      return idleExitMs > 0 && now >= deadline;
    },
    capBlockMs(blockMs: number, now = clock()) {
      if (idleExitMs <= 0) {
        return blockMs;
      }
      const remaining = deadline - now;
      if (remaining <= 0) {
        return 0;
      }
      if (blockMs <= 0) {
        return blockMs;
      }
      return Math.min(blockMs, remaining);
    },
  };
}
