import { createFileRoute } from '@tanstack/react-router';
import { usePortalAuth } from '@/auth/auth-context';
import { DashboardProgressOverview } from '@/components/dashboard/dashboard-progress-overview';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardHomePage,
});

function DashboardHomePage() {
  const { user } = usePortalAuth();
  const first =
    user?.firstName?.trim() ||
    (user?.email ? user.email.split('@')[0] : null) ||
    'there';
  const wave = String.fromCodePoint(0x1f44b);

  return (
    <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Welcome back, {first} {wave}
        </h1>
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Your progress</h2>
          <DashboardProgressOverview />
        </section>
      </div>
    </main>
  );
}
