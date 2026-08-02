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
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full">
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
          <WorkspaceSidebar
            userName={session.user.name}
            userEmail={session.user.email}
          />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="border-b border-border bg-sidebar lg:hidden">
          <WorkspaceSidebar
            userName={session.user.name}
            userEmail={session.user.email}
          />
        </div>
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
