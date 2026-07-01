import { createFileRoute, Link, Navigate, Outlet } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { usePortalAuth } from '@/auth/auth-context';
import { SiteBrandMark } from '@/components/layout/site-brand-mark';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});

function AdminLayout() {
  const { isLoaded, isSignedIn, signOut } = usePortalAuth();
  const currentUser = useCurrentUser();

  if (!isLoaded || (isSignedIn && currentUser.isLoading)) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!isSignedIn) return <Navigate to="/auth/login" replace />;
  if (currentUser.data?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-6">
          <SiteBrandMark />
          <Link to="/admin" className="font-serif font-semibold text-brand-dark">
            Beyond Grades Admin
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {currentUser.data.email}
            </span>
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>
              <LogOut className="mr-2 size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

