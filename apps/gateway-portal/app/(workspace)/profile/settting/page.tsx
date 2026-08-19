import type { Metadata } from "next";

import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { requireSession } from "@/lib/auth-server";
import { privatePageMetadata } from "@/lib/site";

export const metadata: Metadata = privatePageMetadata(
  "Profile",
  "Update your display name and avatar for the Gateway portal.",
);

export default function ProfileSettingsPage() {
  return <ProfileSettingsPageInner />;
}

async function ProfileSettingsPageInner() {
  const session = await requireSession("/profile/settting");

  return (
    <ProfileSettingsForm
      initialName={session.user.name || ""}
      initialImage={session.user.image || null}
      email={session.user.email || ""}
    />
  );
}
