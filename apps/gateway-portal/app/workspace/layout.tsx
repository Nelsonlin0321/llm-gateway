import type { ReactNode } from "react";

import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { requireSession } from "@/lib/auth-server";

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession("/workspace");

  return (
    <main className="mx-auto flex min-h-[calc(100vh-73px)] w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <WorkspaceSidebar
            userName={session.user.name}
            userEmail={session.user.email}
          />
        </aside>
        {children}
      </div>
    </main>
  );
}
