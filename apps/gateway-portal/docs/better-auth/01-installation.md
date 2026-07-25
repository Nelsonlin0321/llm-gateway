---
title: Installation
description: Learn how to configure Better Auth in your project.
---
## Installation
```shell
npm install better-auth
npm install @better-auth/prisma-adapter
```

## Set Env Variables
```shell
# openssl rand -hex 32
BETTER_AUTH_API_KEY=
BETTER_AUTH_URL=http://localhost:3000
```


## Create A Better Auth Instance
/lib/auth.ts
```ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  //...
});
```

## Configure Database
Reference: https://better-auth.com/docs/adapters/prisma
```ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
});
```
