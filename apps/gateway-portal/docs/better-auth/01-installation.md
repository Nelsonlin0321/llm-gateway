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
  emailAndPassword: { enabled: true },
  trustedOrigins: ["http://localhost:3001"],
});
```

## Setup API Route

/api/auth/[...all]/route.ts

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

Reference: https://www.prisma.io/docs/guides/authentication/better-auth/nextjs

## Create Auth Client

You'll need a client-side utility to interact with these endpoints from your React components. In the src/lib directory, create an auth-client.ts file:
lib/auth-client.ts

```ts
import { createAuthClient } from "better-auth/react";

export const { signIn, signUp, signOut, useSession } = createAuthClient();
```

## Example Usage in the client-side page

src/app/sign-up/page.tsx

```ts
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    const res = await signUp.email({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    if (res.error) {
      setError(res.error.message || "Something went wrong.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Sign Up</h1>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {" "}
        <input
          name="name"
          placeholder="Full Name"
          required
          className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2"
        />{" "}
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2"
        />{" "}
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          minLength={8}
          className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2"
        />{" "}
        <button
          type="submit"
          className="w-full bg-white text-black font-medium rounded-md px-4 py-2 hover:bg-gray-200"
        >
          {" "}
          // [!code ++] Create Account
        </button>{" "}
      </form>{" "}
    </main>
  );
}
```
