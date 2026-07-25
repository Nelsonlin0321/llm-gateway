# Installation
```shell
npm install prisma --save-dev
npm install @prisma/client @prisma/adapter-neon dotenv
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

```ts
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```