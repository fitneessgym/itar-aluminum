import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { CloudSync } from "@/components/cloud-sync";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/app")({ component: AppPage });

function AppPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <div className="grid min-h-dvh grid-cols-2 gap-3 bg-bg p-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-surface" />
        ))}
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return (
    <>
      <CloudSync />
      <AppShell />
    </>
  );
}
