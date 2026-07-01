import { UserButton } from '@clerk/react';
import { Link, useRouterState } from '@tanstack/react-router';
import { LayoutDashboard, LogOut, Settings } from 'lucide-react';
import { usePortalAuth } from '@/auth/auth-context';
import { getAuthMode } from '@/auth/env';
import { SiteBrandMark } from '@/components/layout/site-brand-mark';
import { DashboardCourseSidebarSection } from '@/components/dashboard/dashboard-course-sidebar-section';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ContentDashboardNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const dashboardActive = pathname === '/dashboard' || pathname === '/dashboard/';
  const settingsActive =
    pathname === '/dashboard/settings' || pathname.startsWith('/dashboard/settings/');

  return (
    <nav className="flex flex-col gap-0.5 p-3" aria-label="Dashboard">
      <Link
        to="/dashboard"
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          dashboardActive
            ? 'bg-brand-indigo/10 text-brand-indigo'
            : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
        )}
      >
        <LayoutDashboard className="size-4 shrink-0 opacity-80" aria-hidden />
        Dashboard
      </Link>

      <DashboardCourseSidebarSection onNavigate={onNavigate} />

      <Link
        to="/dashboard/settings"
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          settingsActive
            ? 'bg-brand-indigo/10 text-brand-indigo'
            : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
        )}
      >
        <Settings className="size-4 shrink-0 opacity-80" aria-hidden />
        Account Settings
      </Link>
    </nav>
  );
}

export function ContentDashboardSidebar() {
  const { signOut, user } = usePortalAuth();
  const usesClerk = getAuthMode() === 'clerk';
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Account';

  return (
    <aside className="hidden h-svh w-60 shrink-0 flex-col border-r border-border bg-white md:flex">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-5">
        <SiteBrandMark />
        <span className="truncate font-serif font-semibold text-brand-dark">beyond grades</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <ContentDashboardNavLinks />
      </div>

      <div className="shrink-0 border-t border-border p-3">
        {usesClerk ? (
          <div className="flex min-w-0 items-center gap-3 rounded-md px-3 py-2">
            <UserButton />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
              {user?.email && displayName !== user.email && (
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              )}
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={() => void signOut()}
          >
            <LogOut className="size-4" aria-hidden />
            Logout
          </Button>
        )}
      </div>
    </aside>
  );
}
