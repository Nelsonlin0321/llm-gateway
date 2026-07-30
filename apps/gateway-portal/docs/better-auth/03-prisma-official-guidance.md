# Better Auth (with Next.js) (/docs/guides/authentication/better-auth/nextjs)

> For the complete Prisma documentation index, see [llms.txt](https://www.prisma.io/docs/llms.txt). A markdown version of any docs page is available by appending `.md` to its URL.

Learn how to use Prisma ORM in a Next.js app with Better Auth

Location: Guides > Authentication > Better Auth > Better Auth (with Next.js)

## Introduction [#introduction]

[Better Auth](https://better-auth.com/) is a modern, open-source authentication solution for web applications. It's built with TypeScript and provides a simple and extensible auth experience with support for multiple database adapters, including Prisma.

In this guide, you'll wire Better Auth into a brand-new [Next.js](https://nextjs.org/) app and persist users in a [Prisma Postgres](https://prisma.io/postgres) database. You can find a complete example of this guide on [GitHub](https://github.com/prisma/prisma-examples/tree/latest/orm/betterauth-nextjs).

## Prerequisites [#prerequisites]

- [Node.js 20+](https://nodejs.org)
- Basic familiarity with Next.js App Router and Prisma

## 1. Set up your project [#1-set-up-your-project]

Create a new Next.js application:

#### bun

```bash
bunx create-next-app@latest betterauth-nextjs-prisma
```

#### pnpm

```bash
pnpm dlx create-next-app@latest betterauth-nextjs-prisma
```

#### yarn

```bash
yarn dlx create-next-app@latest betterauth-nextjs-prisma
```

#### npm

```bash
npx create-next-app@latest betterauth-nextjs-prisma
```

It will prompt you to customize your setup. Choose the defaults:

> [!NOTE]
>
> - _Would you like to use TypeScript?_ `Yes`
> - _Would you like to use ESLint?_ `Yes`
> - _Would you like to use Tailwind CSS?_ `Yes`
> - _Would you like your code inside a `src/` directory?_ `Yes`
> - _Would you like to use App Router?_ `Yes`
> - _Would you like to use Turbopack?_ `Yes`
> - _Would you like to customize the import alias (`@/_`by default)?\*`No`

Navigate to the project directory:

```bash
cd betterauth-nextjs-prisma
```

These selections will create a modern Next.js project with TypeScript for type safety, ESLint for code quality, and Tailwind CSS for styling. Using the `src/` directory and the App Router are common conventions for new Next.js applications.

## 2. Set up Prisma [#2-set-up-prisma]

Next, you'll add Prisma to your project to manage your database.

### 2.1. Install Prisma and dependencies [#21-install-prisma-and-dependencies]

Install the necessary Prisma packages. The dependencies differ slightly depending on whether you use Prisma Postgres with Accelerate or another database.

#### bun

```bash
bun add prisma tsx @types/pg --dev
```

#### pnpm

```bash
pnpm add prisma tsx @types/pg --save-dev
```

#### yarn

```bash
yarn add prisma tsx @types/pg --dev
```

#### npm

```bash
npm install prisma tsx @types/pg --save-dev
```

#### bun

```bash
bun add @prisma/client @prisma/adapter-pg dotenv pg
```

#### pnpm

```bash
pnpm add @prisma/client @prisma/adapter-pg dotenv pg
```

#### yarn

```bash
yarn add @prisma/client @prisma/adapter-pg dotenv pg
```

#### npm

```bash
npm install @prisma/client @prisma/adapter-pg dotenv pg
```

> [!NOTE]
> If you are using a different database provider (MySQL, SQL Server, SQLite), install the corresponding driver adapter package instead of `@prisma/adapter-pg`. For more information, see [Database drivers](https://www.prisma.io/docs/orm/core-concepts/supported-databases/database-drivers).

Once installed, initialize Prisma in your project:

#### bun

```bash
bunx --bun prisma init --output ../src/generated/prisma
```

#### pnpm

```bash
pnpm dlx prisma init --output ../src/generated/prisma
```

#### yarn

```bash
yarn dlx prisma init --output ../src/generated/prisma
```

#### npm

```bash
npx prisma init --output ../src/generated/prisma
```

> [!NOTE]
> `prisma init` creates the Prisma scaffolding and a local `DATABASE_URL`. In the next step, you will create a Prisma Postgres database and replace that value with a direct `postgres://...` connection string.

This will create:

- A `prisma` directory with a `schema.prisma` file
- A `.env` file containing a local `DATABASE_URL` at the project root
- An `output` directory for the generated Prisma Client as `better-auth/generated/prisma`

Create a Prisma Postgres database and replace the generated `DATABASE_URL` in your `.env` file with the `postgres://...` connection string from the CLI output:

#### bun

```bash
bunx create-db
```

#### pnpm

```bash
pnpm dlx create-db
```

#### yarn

```bash
yarn dlx create-db
```

#### npm

```bash
npx create-db
```

### 2.2. Configure Prisma [#22-configure-prisma]

Create a `prisma.config.ts` file in the root of your project with the following content:

```typescript title="prisma.config.ts"
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

> [!NOTE]
> The `dotenv` package should already be installed as it's a Next.js dependency. If not, install it using:
>
> #### bun

>     ```bash
>     bun add dotenv
>     ```
>
> #### pnpm

>     ```bash
>     pnpm add dotenv
>     ```
>
> #### yarn

>     ```bash
>     yarn add dotenv
>     ```
>
> #### npm

>     ```bash
>     npm install dotenv
>     ```

### 2.3. Generate the Prisma client [#23-generate-the-prisma-client]

Run the following command to create the database tables and generate the Prisma Client:

#### bun

```bash
bunx prisma generate
```

#### pnpm

```bash
pnpm dlx prisma generate
```

#### yarn

```bash
yarn dlx prisma generate
```

#### npm

```bash
npx prisma generate
```

### 2.4. Set up a global Prisma client [#24-set-up-a-global-prisma-client]

In the `src` directory, create a `lib` folder and a `prisma.ts` file inside it. This file will be used to create and export your Prisma Client instance.

```bash
mkdir -p src/lib
touch src/lib/prisma.ts
```

Set up the Prisma client like this:

```tsx title="src/lib/prisma.ts"
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
```

> [!WARNING]
> We recommend using a connection pooler (like [Prisma Accelerate](https://www.prisma.io/accelerate)) to manage database connections efficiently.
>
> If you choose not to use one, **avoid** instantiating `PrismaClient` globally in long-lived environments. Instead, create and dispose of the client per request to prevent exhausting your database connections.

## 3. Set up Better Auth [#3-set-up-better-auth]

Now it's time to integrate Better Auth for authentication.

### 3.1. Install and configure Better Auth [#31-install-and-configure-better-auth]

First, install the Better Auth core package:

#### bun

```bash
bun add better-auth
```

#### pnpm

```bash
pnpm add better-auth
```

#### yarn

```bash
yarn add better-auth
```

#### npm

```bash
npm install better-auth
```

Next, generate a secure secret that Better Auth will use to sign authentication tokens. This ensures your tokens cannot be messed with.

#### bun

```bash
bunx auth@latest secret
```

#### pnpm

```bash
pnpm dlx auth@latest secret
```

#### yarn

```bash
yarn dlx auth@latest secret
```

#### npm

```bash
npx auth@latest secret
```

Copy the generated secret and add it, along with your application's URL, to your `.env` file:

```bash title=".env"
# Better Auth
BETTER_AUTH_SECRET=your-generated-secret # [!code ++]
BETTER_AUTH_URL=http://localhost:3000 # [!code ++]

# Prisma
DATABASE_URL="your-database-url"
```

Now, create a configuration file for Better Auth. In the `src/lib` directory, create an `auth.ts` file:

```bash
touch src/lib/auth.ts
```

In this file, you'll configure Better Auth to use the Prisma adapter, which allows it to persist user and session data in your database. You will also enable email and password authentication.

```ts title="src/lib/auth.ts"
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
});
```

Better Auth also supports other sign-in methods like social logins (Google, GitHub, etc.), which you can explore in their [documentation](https://www.better-auth.com/docs/authentication/email-password).

```ts title="src/lib/auth.ts"
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    // [!code ++]
    enabled: true, // [!code ++]
  }, // [!code ++]
});
```

> [!NOTE]
> If your application runs on a port other than `3000`, you must add it to the `trustedOrigins` in your `auth.ts` configuration to avoid CORS errors during authentication requests.
>
> ```ts title="src/lib/auth.ts"
> import { betterAuth } from "better-auth";
> import { prismaAdapter } from "better-auth/adapters/prisma";
> import prisma from "@/lib/prisma";
>
> export const auth = betterAuth({
>   database: prismaAdapter(prisma, {
>     provider: "postgresql",
>   }),
>   emailAndPassword: {
>     enabled: true,
>   },
>   trustedOrigins: ["http://localhost:3001"], // [!code ++]
> });
> ```

### 3.2. Add Better Auth models to your schema [#32-add-better-auth-models-to-your-schema]

Better Auth provides a CLI command to automatically add the necessary authentication models (`User`, `Session`, `Account`, and `Verification`) to your `schema.prisma` file.

Run the following command:

#### bun

```bash
bunx auth generate
```

#### pnpm

```bash
pnpm dlx auth generate
```

#### yarn

```bash
yarn dlx auth generate
```

#### npm

```bash
npx auth generate
```

> [!NOTE]
> It will ask for confirmation to overwrite your existing Prisma schema. Select `y`.

This will add the following models:

```prisma
model User {
  id            String    @id
  name          String
  email         String
  emailVerified Boolean
  image         String?
  createdAt     DateTime
  updatedAt     DateTime
  sessions      Session[]
  accounts      Account[]

  @@unique([email])
  @@map("user")
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String
  createdAt DateTime
  updatedAt DateTime
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([token])
  @@map("session")
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime
  updatedAt             DateTime

  @@map("account")
}

model Verification {
  id         String    @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime?
  updatedAt  DateTime?

  @@map("verification")
}
```

### 3.3. Migrate the database [#33-migrate-the-database]

With the new models in your schema, you need to update your database. Run a migration to create the corresponding tables:

#### bun

```bash
bunx prisma migrate dev --name add-auth-models
```

#### pnpm

```bash
pnpm dlx prisma migrate dev --name add-auth-models
```

#### yarn

```bash
yarn dlx prisma migrate dev --name add-auth-models
```

#### npm

```bash
npx prisma migrate dev --name add-auth-models
```

#### bun

```bash
bunx prisma generate
```

#### pnpm

```bash
pnpm dlx prisma generate
```

#### yarn

```bash
yarn dlx prisma generate
```

#### npm

```bash
npx prisma generate
```

## 4. Set up the API routes [#4-set-up-the-api-routes]

Better Auth needs an API endpoint to handle authentication requests like sign-in, sign-up, and sign-out. You'll create a catch-all API route in Next.js to handle all requests sent to `/api/auth/[...all]`.

In the `src/app/api` directory, create an `auth/[...all]` folder structure and a `route.ts` file inside it:

```bash
mkdir -p "src/app/api/auth/[...all]"
touch "src/app/api/auth/[...all]/route.ts"
```

Add the following code to the newly created `route.ts` file. This code uses a helper from Better Auth to create Next.js-compatible `GET` and `POST` request handlers.

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

Next, you'll need a client-side utility to interact with these endpoints from your React components. In the `src/lib` directory, create an `auth-client.ts` file:

```bash
touch src/lib/auth-client.ts
```

Add the following code, which creates the React hooks and functions you'll use in your UI:

```ts
import { createAuthClient } from "better-auth/react";

export const { signIn, signUp, signOut, useSession } = createAuthClient();
```

## 5. Set up your pages [#5-set-up-your-pages]

Now, let's build the user interface for authentication. In the `src/app` directory, create the following folder structure:

- `sign-up/page.tsx`
- `sign-in/page.tsx`
- `dashboard/page.tsx`

```bash
mkdir -p src/app/{sign-up,sign-in,dashboard}
touch src/app/{sign-up,sign-in,dashboard}/page.tsx
```

### 5.1. Sign up page [#51-sign-up-page]

First, create the basic `SignUpPage` component in `src/app/sign-up/page.tsx`. This sets up the main container and a title for your page.

```tsx title="src/app/sign-up/page.tsx"
"use client";

export default function SignUpPage() {
  return (
    <main className="max-w-md mx-auto p-6 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Sign Up</h1>
    </main>
  );
}
```

Next, import the necessary hooks from React and Next.js to manage state and navigation. Initialize the router and a state variable to hold any potential error messages.

```tsx title="src/app/sign-up/page.tsx"
"use client";

import { useState } from "react"; // [!code ++]
import { useRouter } from "next/navigation"; // [!code ++]

export default function SignUpPage() {
  const router = useRouter(); // [!code ++]
  const [error, setError] = useState<string | null>(null); // [!code ++]

  return (
    <main className="max-w-md mx-auto p-6 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Sign Up</h1>
    </main>
  );
}
```

Now, import the `signUp` function from your Better Auth client and add the `handleSubmit` function. This function is triggered on form submission and calls the `signUp.email` method provided by Better Auth, passing the user's name, email, and password.

```tsx title="src/app/sign-up/page.tsx"
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
//add-next-lin
import { signUp } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // [!code ++]
    e.preventDefault(); // [!code ++]
    setError(null); // [!code ++]
    // [!code ++]
    const formData = new FormData(e.currentTarget); // [!code ++]
    // [!code ++]
    const res = await signUp.email({
      // [!code ++]
      name: formData.get("name") as string, // [!code ++]
      email: formData.get("email") as string, // [!code ++]
      password: formData.get("password") as string, // [!code ++]
    }); // [!code ++]
    // [!code ++]
    if (res.error) {
      // [!code ++]
      setError(res.error.message || "Something went wrong."); // [!code ++]
    } else {
      // [!code ++]
      router.push("/dashboard"); // [!code ++]
    } // [!code ++]
  } // [!code ++]

  return (
    <main className="max-w-md mx-auto p-6 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Sign Up</h1>
    </main>
  );
}
```

To inform the user of any issues, add an element that conditionally renders when the `error` state is not null.

```tsx title="src/app/sign-up/page.tsx"
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
      {error && <p className="text-red-500">{error}</p>} // [!code ++]
    </main>
  );
}
```

Finally, add the HTML form with input fields for the user's name, email, and password, and a submit button.

```tsx title="src/app/sign-up/page.tsx"
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
        // [!code ++]
        <input // [!code ++]
          name="name" // [!code ++]
          placeholder="Full Name" // [!code ++]
          required // [!code ++]
          className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2" // [!code ++]
        />{" "}
        // [!code ++]
        <input // [!code ++]
          name="email" // [!code ++]
          type="email" // [!code ++]
          placeholder="Email" // [!code ++]
          required // [!code ++]
          className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2" // [!code ++]
        />{" "}
        // [!code ++]
        <input // [!code ++]
          name="password" // [!code ++]
          type="password" // [!code ++]
          placeholder="Password" // [!code ++]
          required // [!code ++]
          minLength={8} // [!code ++]
          className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2" // [!code ++]
        />{" "}
        // [!code ++]
        <button // [!code ++]
          type="submit" // [!code ++]
          className="w-full bg-white text-black font-medium rounded-md px-4 py-2 hover:bg-gray-200" // [!code ++]
        >
          {" "}
          // [!code ++] Create Account // [!code ++]
        </button>{" "}
        // [!code ++]
      </form>{" "}
      // [!code ++]
    </main>
  );
}
```

### 5.2. Sign in page [#52-sign-in-page]

For the sign-in page, start with the basic structure in `src/app/sign-in/page.tsx`.

```tsx title="src/app/sign-in/page.tsx"
"use client";

export default function SignInPage() {
  return (
    <main className="max-w-md h-screen flex items-center justify-center flex-col mx-auto p-6 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Sign In</h1>
    </main>
  );
}
```

Now, add the state and router hooks, similar to the sign-up page.

```tsx title="src/app/sign-in/page.tsx"
"use client";

import { useState } from "react"; // [!code ++]
import { useRouter } from "next/navigation"; // [!code ++]

export default function SignInPage() {
  const router = useRouter(); // [!code ++]
  const [error, setError] = useState<string | null>(null); // [!code ++]

  return (
    <main className="max-w-md h-screen flex items-center justify-center flex-col mx-auto p-6 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Sign In</h1>
    </main>
  );
}
```

Add the `handleSubmit` function, this time importing and using the `signIn.email` method from Better Auth.

```tsx title="src/app/sign-in/page.tsx"
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client"; // [!code ++]

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // [!code ++]
    e.preventDefault(); // [!code ++]
    setError(null); // [!code ++]
    // [!code ++]
    const formData = new FormData(e.currentTarget); // [!code ++]
    // [!code ++]
    const res = await signIn.email({
      // [!code ++]
      email: formData.get("email") as string, // [!code ++]
      password: formData.get("password") as string, // [!code ++]
    }); // [!code ++]
    // [!code ++]
    if (res.error) {
      // [!code ++]
      setError(res.error.message || "Something went wrong."); // [!code ++]
    } else {
      // [!code ++]
      router.push("/dashboard"); // [!code ++]
    } // [!code ++]
  } // [!code ++]

  return (
    <main className="max-w-md h-screen flex items-center justify-center flex-col mx-auto p-6 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Sign In</h1>
    </main>
  );
}
```

Add the conditional error message display.

```tsx title="src/app/sign-in/page.tsx"
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    const res = await signIn.email({
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
    <main className="max-w-md h-screen flex items-center justify-center flex-col mx-auto p-6 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Sign In</h1>
      {error && <p className="text-red-500">{error}</p>} // [!code ++]
    </main>
  );
}
```

Finally, add the form fields for email and password and a sign-in button.

```tsx title="src/app/sign-in/page.tsx"
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    const res = await signIn.email({
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
    <main className="max-w-md h-screen flex items-center justify-center flex-col mx-auto p-6 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Sign In</h1>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {" "}
        // [!code ++]
        <input // [!code ++]
          name="email" // [!code ++]
          type="email" // [!code ++]
          placeholder="Email" // [!code ++]
          required // [!code ++]
          className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2" // [!code ++]
        />{" "}
        // [!code ++]
        <input // [!code ++]
          name="password" // [!code ++]
          type="password" // [!code ++]
          placeholder="Password" // [!code ++]
          required // [!code ++]
          className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2" // [!code ++]
        />{" "}
        // [!code ++]
        <button // [!code ++]
          type="submit" // [!code ++]
          className="w-full bg-white text-black font-medium rounded-md px-4 py-2 hover:bg-gray-200" // [!code ++]
        >
          {" "}
          // [!code ++] Sign In // [!code ++]
        </button>{" "}
        // [!code ++]
      </form>{" "}
      // [!code ++]
    </main>
  );
}
```

### 5.3. Dashboard page [#53-dashboard-page]

This is the protected page for authenticated users. Start with the basic component in `src/app/dashboard/page.tsx`.

```tsx title="src/app/dashboard/page.tsx"
"use client";

export default function DashboardPage() {
  return (
    <main className="max-w-md h-screen flex items-center justify-center flex-col mx-auto p-6 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Dashboard</h1>
    </main>
  );
}
```

Import the `useSession` hook from your Better Auth client. This hook is the key to managing authentication state on the client side. It provides the session data and a pending status.

```tsx title="src/app/dashboard/page.tsx"
"use client";

import { useRouter } from "next/navigation"; // [!code ++]
import { useSession } from "@/lib/auth-client"; // [!code ++]

export default function DashboardPage() {
  const router = useRouter(); // [!code ++]
  const { data: session, isPending } = useSession(); // [!code ++]

  return (
    <main className="max-w-md h-screen flex items-center justify-center flex-col mx-auto p-6 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Dashboard</h1>
    </main>
  );
}
```

To protect this route, use a `useEffect` hook. This effect checks if the session has loaded (`!isPending`) and if there is no authenticated user (`!session?.user`). If both are true, it redirects the user to the sign-in page.

```tsx title="src/app/dashboard/page.tsx"
"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useEffect } from "react"; // [!code ++]

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    // [!code ++]
    if (!isPending && !session?.user) {
      // [!code ++]
      router.push("/sign-in"); // [!code ++]
    } // [!code ++]
  }, [isPending, session, router]); // [!code ++]

  return (
    <main className="max-w-md h-screen flex items-center justify-center flex-col mx-auto p-6 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Dashboard</h1>
    </main>
  );
}
```

To provide a better user experience, add loading and redirecting states while the session is being verified.

```tsx title="src/app/dashboard/page.tsx"
"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
    }
  }, [isPending, session, router]);

  if (isPending)
    // [!code ++]
    return <p className="text-center mt-8 text-white">Loading...</p>; // [!code ++]
  if (!session?.user)
    // [!code ++]
    return <p className="text-center mt-8 text-white">Redirecting...</p>; // [!code ++]

  return (
    <main className="max-w-md h-screen flex items-center justify-center flex-col mx-auto p-6 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Dashboard</h1>
    </main>
  );
}
```

Finally, if the user is authenticated, display their name and email from the `session` object. Also, import the `signOut` function and add a button that calls it, allowing the user to log out.

```tsx title="src/app/dashboard/page.tsx"
"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
    }
  }, [isPending, session, router]);

  if (isPending)
    return <p className="text-center mt-8 text-white">Loading...</p>;
  if (!session?.user)
    return <p className="text-center mt-8 text-white">Redirecting...</p>;

  const { user } = session; // [!code ++]

  return (
    <main className="max-w-md h-screen flex items-center justify-center flex-col mx-auto p-6 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Welcome, {user.name || "User"}!</p>
      <p>Email: {user.email}</p>
      <button
        onClick={() => signOut()}
        className="w-full bg-white text-black font-medium rounded-md px-4 py-2 hover:bg-gray-200"
      >
        Sign Out
      </button>
    </main>
  );
}
```

### 5.4. Home page [#54-home-page]

Finally, update the home page to provide simple navigation to the sign-in and sign-up pages. Replace the contents of `src/app/page.tsx` with the following:

```tsx title="src/app/page.tsx"
"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex items-center justify-center h-screen bg-neutral-950 text-white">
      <div className="flex gap-4">
        <button
          onClick={() => router.push("/sign-up")}
          className="bg-white text-black font-medium px-6 py-2 rounded-md hover:bg-gray-200"
        >
          Sign Up
        </button>
        <button
          onClick={() => router.push("/sign-in")}
          className="border border-white text-white font-medium px-6 py-2 rounded-md hover:bg-neutral-800"
        >
          Sign In
        </button>
      </div>
    </main>
  );
}
```

## 6. Test it out [#6-test-it-out]

Your application is now fully configured.

1. Start the development server to test it:

#### bun

```bash
bun run dev
```

#### pnpm

```bash
pnpm run dev
```

#### yarn

```bash
yarn dev
```

#### npm

```bash
npm run dev
```

2. Navigate to `http://localhost:3000` in your browser. You should see the home page with "Sign Up" and "Sign In" buttons.

3. Click on **Sign Up**, create a new account, and you should be redirected to the dashboard. You can then sign out and sign back in.

4. To view the user data directly in your database, you can use Prisma Studio.

#### bun

```bash
bunx prisma studio
```

#### pnpm

```bash
pnpm dlx prisma studio
```

#### yarn

```bash
yarn dlx prisma studio
```

#### npm

```bash
npx prisma studio
```

5. This will open a new tab in your browser where you can see the `User`, `Session`, and `Account` tables and their contents.

> [!TIP]
> Congratulations! You now have a fully functional authentication system built with Better Auth, Prisma, and Next.js.

## Next steps [#next-steps]

- Add support for social login or magic links
- Implement password reset and email verification
- Add user profile and account management pages
- Deploy to Vercel and secure your environment variables
- Extend your Prisma schema with custom application models

## Further reading [#further-reading]

- [Better Auth documentation](https://www.better-auth.com/docs)
- [Prisma documentation](https://www.prisma.io/docs/orm)
- [Next.js App Router](https://nextjs.org/docs/app)

## Related pages

- [`Better Auth (with Astro)`](https://www.prisma.io/docs/guides/authentication/better-auth/astro): Learn how to use Prisma ORM in an Astro app with Better Auth
