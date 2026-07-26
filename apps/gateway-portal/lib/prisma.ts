import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon"; // change to be @prisma/adapter-pg if the database does not support neon serverless
import { neonConfig } from "@neondatabase/serverless";

import ws from "ws";
import { PrismaClient } from "@/generated/prisma/client";
neonConfig.webSocketConstructor = ws;

// To work in edge environments (Cloudflare Workers, Vercel Edge, etc.), enable querying over fetch
neonConfig.poolQueryViaFetch = true;

// Type definitions
declare global {
  var prisma: PrismaClient | undefined;
}

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaNeon({ connectionString });
const prisma = global.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV === "development") global.prisma = prisma;

export default prisma;
