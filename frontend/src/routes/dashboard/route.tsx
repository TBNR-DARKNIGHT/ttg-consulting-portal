import { createFileRoute, Outlet } from '@tanstack/react-router';
import { usePortalAuth } from '@/auth/auth-context';
import { ContentDashboardShell } from '@/components/dashboard/content-dashboard-shell';

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { isLoaded } = usePortalAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <ContentDashboardShell>
      <Outlet />
    </ContentDashboardShell>
  );
}
