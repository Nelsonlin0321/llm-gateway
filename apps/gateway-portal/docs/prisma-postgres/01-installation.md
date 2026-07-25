# Installation
```shell
npm install prisma --save-dev
npm install @prisma/client @prisma/adapter-neon dotenv
npm i --save-dev @types/ws
npm i ws
```

# Initialization
```shell
npx prisma init --output ../generated/prisma
```

# Configuration
prisma.config.ts
```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

prisma/schema.prisma
```ts
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

# Create Prisma Client
lib/prisma.ts
```ts
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
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

```

# Generate Better Auth Schema
```shell
npx auth@latest generate
```


# Apply Migrations
```shell
npx prisma migrate dev --name initial
```