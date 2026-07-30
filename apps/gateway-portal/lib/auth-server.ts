import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export async function getSessionOrNull() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireSession(returnTo?: string) {
  const session = await getSessionOrNull();

  if (!session) {
    if (returnTo) {
      redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
    }
    redirect("/sign-in");
  }

  return session;
}
