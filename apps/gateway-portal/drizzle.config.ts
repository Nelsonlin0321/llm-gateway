import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DIRECT_URL) {
  throw new Error("DIRECT_URL is not set");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL,
  },
  verbose: true,
  strict: true,
  casing: "snake_case",
});
