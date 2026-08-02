/// <reference types="bun" />
/**
 * Pure mock generators for `event_log` seed data.
 */

export type MockEventLogRow = {
  eventId: string;
  requestId: string;
  schemaVersion: number;
  eventType: string;
  startedAt: string; // ISO
  completedAt: string; // ISO
  gatewayPath: string;
  httpMethod: string;
  apiFamily: "openai" | "anthropic";
  providerId: null;
  provider: string;
  requestedModel: string;
  requestedModelAlias: string;
  upstreamModel: string;
  upstreamUrl: string;
  isStream: boolean;
  responseMode: "stream" | "non-stream";
  childKeyId: null;
  childKeyName: string;
  childKeyCreatorId: null;
  childKeyIssuedAt: number;
  childKeyTagsJson: Record<string, string>;
  userEmail: string;
  metadataJson: Record<string, unknown>;
  statusCode: number;
  responseContentType: string;
  durationMs: number;
  firstTokenMs: number | null;
  responseId: string;
  inputToken: number;
  outputToken: number;
  cachedInputToken: number;
  totalToken: number;
  cost: number;
  loggedAt: string; // ISO
  logDate: string; // YYYY-MM-DD
  inputPrice: number;
  outputPrice: number;
  inputCachePrice: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

type ProviderCatalogEntry = {
  provider: string;
  apiFamily: "openai" | "anthropic";
  models: string[];
  upstreamUrl: string;
};

const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  {
    provider: "openai",
    apiFamily: "openai",
    models: ["gpt-5.1", "gpt-4.1-mini"],
    upstreamUrl: "https://api.openai.com/v1/chat/completions",
  },
  {
    provider: "anthropic",
    apiFamily: "anthropic",
    models: ["claude-sonnet-4", "claude-haiku-4"],
    upstreamUrl: "https://api.anthropic.com/v1/messages",
  },
  {
    provider: "openrouter",
    apiFamily: "openai",
    models: ["openai/gpt-5.1", "google/gemini-2.5-flash"],
    upstreamUrl: "https://openrouter.ai/api/v1/chat/completions",
  },
  {
    provider: "deepseek",
    apiFamily: "openai",
    models: ["deepseek-v4-flash"],
    upstreamUrl: "https://api.deepseek.com/v1/chat/completions",
  },
  {
    provider: "minimax",
    apiFamily: "openai",
    models: ["minimax-m3"],
    upstreamUrl: "https://api.minimax.chat/v1/text/chatcompletion_v2",
  },
  {
    provider: "moonshotai",
    apiFamily: "openai",
    models: ["moonshot-v1-8k", "kimi-k2"],
    upstreamUrl: "https://api.moonshot.cn/v1/chat/completions",
  },
  {
    provider: "google",
    apiFamily: "openai",
    models: ["gemini-2.5-flash", "gemini-2.5-pro"],
    upstreamUrl:
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  },
];

const TEAMS = ["growth", "platform", "ml", "infra", "research"] as const;
const ENVS = ["prod", "staging", "dev"] as const;
const FIRST_NAMES = [
  "alice",
  "bob",
  "carol",
  "dave",
  "erin",
  "frank",
  "grace",
  "heidi",
] as const;

/** Default rows-per-day range when not overridden. */
export const DEFAULT_PER_DAY_MIN = 10;
export const DEFAULT_PER_DAY_MAX = 1000;

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

export function intBetween(
  min: number,
  max: number,
  rng: () => number,
): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function floatBetween(min: number, max: number, rng: () => number): number {
  return min + rng() * (max - min);
}

/** Round money-ish floats for stable JSON. */
function round(n: number, digits = 6): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/**
 * Simple seeded PRNG (mulberry32) so runs are reproducible with the same seed.
 */
export function createRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inclusive date range as YYYY-MM-DD strings (UTC). */
export function eachLogDate(from: string, to: string): string[] {
  const dates: string[] = [];
  const cur = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  if (Number.isNaN(cur.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error(`invalid date range: ${from} .. ${to}`);
  }
  while (cur.getTime() <= end.getTime()) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

/** Random timestamp within [logDate 00:00, logDate 23:59:59.999] UTC. */
function randomTimeOnDate(logDate: string, rng: () => number): Date {
  const startMs = Date.parse(`${logDate}T00:00:00.000Z`);
  const offsetMs = Math.floor(rng() * 86_400_000);
  return new Date(startMs + offsetMs);
}

function addSeconds(d: Date, seconds: number): Date {
  return new Date(d.getTime() + seconds * 1000);
}

/**
 * Build one mock event_log row for the given log_date.
 */
export function generateMockEventLogRow(
  logDate: string,
  rng: () => number = Math.random,
): MockEventLogRow {
  const catalog = pick(PROVIDER_CATALOG, rng);
  const model = pick(catalog.models, rng);
  const isStream = rng() < 0.55;
  const team = pick(TEAMS, rng);
  const env = pick(ENVS, rng);
  const first = pick(FIRST_NAMES, rng);

  const startedAt = randomTimeOnDate(logDate, rng);
  const durationSec = intBetween(1, 5, rng);
  const completedAt = addSeconds(startedAt, durationSec);
  const logDelaySec = intBetween(1, 5, rng);
  const loggedAt = addSeconds(completedAt, logDelaySec);

  const durationMs = durationSec * 1000 + intBetween(0, 999, rng);
  const firstTokenMs = isStream
    ? intBetween(50, Math.max(50, Math.floor(durationMs * 0.4)), rng)
    : null;

  const inputToken = intBetween(10, 100_000, rng);
  const outputToken = intBetween(10, 100_000, rng);
  const cachedInputToken = intBetween(0, Math.min(1000, inputToken), rng);
  const totalToken = cachedInputToken + inputToken + outputToken;

  const inputPrice = round(floatBetween(1, 15, rng), 4);
  const outputPrice = round(floatBetween(2, 25, rng), 4);
  const inputCachePrice = round(floatBetween(0, 10, rng), 4);

  const cost = round(
    (cachedInputToken / 1_000_000) * inputCachePrice +
      (inputToken / 1_000_000) * inputPrice +
      (outputToken / 1_000_000) * outputPrice,
    6,
  );

  return {
    eventId: crypto.randomUUID(),
    requestId: crypto.randomUUID(),
    schemaVersion: 1,
    eventType: "request",
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    gatewayPath: "/chat",
    httpMethod: "POST",
    apiFamily: catalog.apiFamily,
    providerId: null,
    provider: catalog.provider,
    requestedModel: model,
    requestedModelAlias: `${catalog.provider}/${model}`,
    upstreamModel: model,
    upstreamUrl: catalog.upstreamUrl,
    isStream,
    responseMode: isStream ? "stream" : "non-stream",
    childKeyId: null,
    childKeyName: `team-${team}-${env}`,
    childKeyCreatorId: null,
    childKeyIssuedAt: Math.floor(startedAt.getTime() / 1000),
    childKeyTagsJson: { team, env },
    userEmail: `${first}@example.com`,
    metadataJson: {
      user_id: String(intBetween(1000, 999_999, rng)),
      source: "seed-event-log-mock",
    },
    statusCode: 200,
    responseContentType: "application/json",
    durationMs,
    firstTokenMs,
    responseId: crypto.randomUUID(),
    inputToken,
    outputToken,
    cachedInputToken,
    totalToken,
    cost,
    loggedAt: loggedAt.toISOString(),
    logDate,
    inputPrice,
    outputPrice,
    inputCachePrice,
    createdAt: loggedAt.toISOString(),
    updatedAt: loggedAt.toISOString(),
  };
}

export type GenerateMockOptions = {
  from: string;
  to: string;
  /**
   * Fixed rows per day. When set, overrides the random min/max range.
   */
  perDay?: number;
  /** Inclusive lower bound for random rows/day (default 10). */
  perDayMin?: number;
  /** Inclusive upper bound for random rows/day (default 1000). */
  perDayMax?: number;
  /** PRNG seed for reproducible counts / numeric fields (UUIDs stay random). */
  seed?: number;
};

export type GenerateMockResult = {
  rows: MockEventLogRow[];
  /** How many rows were generated for each log_date. */
  countsByDate: Record<string, number>;
};

/**
 * Resolve how many rows to emit for one day.
 */
export function resolvePerDayCount(
  options: Pick<GenerateMockOptions, "perDay" | "perDayMin" | "perDayMax">,
  rng: () => number,
): number {
  if (options.perDay !== undefined) {
    return options.perDay;
  }
  const min = options.perDayMin ?? DEFAULT_PER_DAY_MIN;
  const max = options.perDayMax ?? DEFAULT_PER_DAY_MAX;
  if (min > max) {
    throw new Error(`perDayMin (${min}) must be <= perDayMax (${max})`);
  }
  return intBetween(min, max, rng);
}

/**
 * Generate mock event_log rows for every day in [from, to] inclusive.
 * By default each day gets a random count in [10, 1000].
 */
export function generateMockEventLogRows(
  options: GenerateMockOptions,
): GenerateMockResult {
  const rng = createRng(options.seed ?? 42);
  const rows: MockEventLogRow[] = [];
  const countsByDate: Record<string, number> = {};

  for (const logDate of eachLogDate(options.from, options.to)) {
    const count = resolvePerDayCount(options, rng);
    countsByDate[logDate] = count;
    for (let i = 0; i < count; i++) {
      rows.push(generateMockEventLogRow(logDate, rng));
    }
  }

  return { rows, countsByDate };
}

/**
 * Generate rows for a single log_date (used by day-by-day seed insert).
 */
export function generateMockEventLogRowsForDate(
  logDate: string,
  options: Omit<GenerateMockOptions, "from" | "to">,
  rng: () => number,
): MockEventLogRow[] {
  const count = resolvePerDayCount(options, rng);
  const rows: MockEventLogRow[] = [];
  for (let i = 0; i < count; i++) {
    rows.push(generateMockEventLogRow(logDate, rng));
  }
  return rows;
}
