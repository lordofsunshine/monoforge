import { ProfileForm } from "@/components/settings/profile-form";
import { LocalizedText } from "@/components/system/localized-text";
import { requireUser } from "@/lib/auth/access";
import { getPrisma } from "@/lib/prisma";

export default async function ProfileSettingsPage() {
  const sessionUser = await requireUser();
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: {
      username: true,
      bio: true,
      image: true,
      email: true,
    },
  });

  return (
    <section className="mx-auto grid max-w-2xl gap-6">
      <div className="border-b border-line pb-5">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
          <LocalizedText path="settings.eyebrow" />
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          <LocalizedText path="settings.profile" />
        </h1>
        <p className="mt-2 text-sm text-secondary">{user.email}</p>
      </div>
      <div className="rounded-lg border border-line bg-surface p-5">
        <ProfileForm username={user.username} bio={user.bio || ""} image={user.image || ""} />
      </div>
    </section>
  );
}
