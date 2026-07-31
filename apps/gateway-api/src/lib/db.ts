import "dotenv/config";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "../db/schema";

neonConfig.webSocketConstructor = ws;

// Edge-friendly querying over fetch when WebSockets are unavailable.
neonConfig.poolQueryViaFetch = true;

type AppDb = ReturnType<typeof createDb>;

declare global {
  // eslint-disable-next-line no-var
  var drizzleDb: AppDb | undefined;
}

function createDb(connectionString: string) {
  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}

function getDb(): AppDb {
  if (global.drizzleDb) {
    return global.drizzleDb;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const instance = createDb(connectionString);
  if (process.env.NODE_ENV === "development") {
    global.drizzleDb = instance;
  }
  return instance;
}

/**
 * Lazy proxy so unit tests can import modules that reference `db` without
 * requiring a live DATABASE_URL (they stub repository methods instead).
 */
export const db = new Proxy({} as AppDb, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export type Db = AppDb;
export * from "../db/schema";
