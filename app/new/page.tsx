import { RepoCreateForm } from "@/components/repository/repo-create-form";
import { LocalizedText } from "@/components/system/localized-text";
import { requireUser } from "@/lib/auth/access";

export default async function NewRepositoryPage() {
  await requireUser();

  return (
    <section className="mx-auto grid max-w-2xl gap-6">
      <div className="border-b border-line pb-5">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
          <LocalizedText path="repoForm.eyebrow" />
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          <LocalizedText path="repoForm.createTitle" />
        </h1>
        <p className="mt-2 text-sm text-secondary">
          <LocalizedText path="repoForm.createDescription" />
        </p>
      </div>
      <div className="rounded-lg border border-line bg-surface p-5">
        <RepoCreateForm />
      </div>
    </section>
  );
}
