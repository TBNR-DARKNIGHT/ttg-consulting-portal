import { UserButton } from '@clerk/react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import {
  ChevronRight,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings,
  UploadCloud,
} from 'lucide-react';
import { usePortalAuth } from '@/auth/auth-context';
import { getAuthMode } from '@/auth/env';
import { SiteBrandMark } from '@/components/layout/site-brand-mark';
import { DashboardCourseSidebarSection } from '@/components/dashboard/dashboard-course-sidebar-section';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/use-current-user';

export function ContentDashboardNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const selectedSettingsTool = useRouterState({
    select: (state) => {
      const tool = state.location.search.tool;
      return tool === 'access-codes' || tool === 'upload-resources' ? tool : undefined;
    },
  });
  const currentUser = useCurrentUser();

  const dashboardActive = pathname === '/dashboard' || pathname === '/dashboard/';
  const settingsActive =
    pathname === '/dashboard/settings' || pathname.startsWith('/dashboard/settings/');
  const isAdmin = currentUser.data?.role === 'ADMIN';
  const [settingsOpen, setSettingsOpen] = useState(settingsActive);

  return (
    <nav className="flex flex-col gap-0.5 p-3" aria-label="Dashboard">
      <Link
        to="/dashboard"
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          dashboardActive
            ? 'bg-brand-indigo/10 text-brand-indigo'
            : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
        )}
      >
        <LayoutDashboard className="size-4 shrink-0 opacity-80" aria-hidden />
        Dashboard
      </Link>

      <DashboardCourseSidebarSection onNavigate={onNavigate} />

      {isAdmin ? (
        <div className="rounded-md">
          <div
            className={cn(
              'group/sidebar-row flex items-center rounded-md pl-1 transition-colors',
              settingsActive
                ? 'bg-brand-indigo/10 text-brand-indigo'
                : 'hover:bg-muted/80',
            )}
          >
            <button
              type="button"
              onClick={() => setSettingsOpen((open) => !open)}
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-md transition-colors group-hover/sidebar-row:text-foreground',
                settingsActive ? 'text-brand-indigo' : 'text-muted-foreground',
              )}
              aria-expanded={settingsOpen}
              aria-label={`${settingsOpen ? 'Collapse' : 'Expand'} Settings`}
            >
              <ChevronRight
                className={cn(
                  'size-4 transition-transform',
                  settingsOpen && 'rotate-90',
                )}
                aria-hidden
              />
            </button>
            <Link
              to="/dashboard/settings"
              search={{}}
              className={cn(
                'min-w-0 flex-1 rounded-md py-2 pr-2 text-left text-sm font-medium transition-colors',
                settingsActive
                  ? 'text-brand-indigo'
                  : 'text-foreground',
              )}
              onClick={() => {
                setSettingsOpen(true);
                onNavigate?.();
              }}
            >
              <span className="whitespace-normal break-words leading-snug">Settings</span>
            </Link>
          </div>
          {settingsOpen && (
            <div className="ml-2 flex flex-col gap-0.5 border-l border-border pl-1">
              <Link
                to="/dashboard/settings"
                search={{}}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                  settingsActive && !selectedSettingsTool
                    ? 'bg-brand-indigo/10 font-medium text-brand-indigo'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                )}
              >
                <Settings className="size-3.5 shrink-0 opacity-80" aria-hidden />
                General
              </Link>
              <Link
                to="/dashboard/settings"
                search={{ tool: 'access-codes' }}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                  selectedSettingsTool === 'access-codes'
                    ? 'bg-brand-indigo/10 font-medium text-brand-indigo'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                )}
              >
                <KeyRound className="size-3.5 shrink-0 opacity-80" aria-hidden />
                Access codes
              </Link>
              <Link
                to="/dashboard/settings"
                search={{ tool: 'upload-resources' }}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                  selectedSettingsTool === 'upload-resources'
                    ? 'bg-brand-indigo/10 font-medium text-brand-indigo'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                )}
              >
                <UploadCloud className="size-3.5 shrink-0 opacity-80" aria-hidden />
                Upload resources
              </Link>
            </div>
          )}
        </div>
      ) : (
        <Link
          to="/dashboard/settings"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            settingsActive
              ? 'bg-brand-indigo/10 text-brand-indigo'
              : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
          )}
        >
          <Settings className="size-4 shrink-0 opacity-80" aria-hidden />
          Settings
        </Link>
      )}
    </nav>
  );
}

export function DashboardAccountControl() {
  const { signOut, user } = usePortalAuth();
  const usesClerk = getAuthMode() === 'clerk';
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Account';

  return usesClerk ? (
    <div className="flex min-w-0 items-center gap-3 rounded-md px-3 py-2">
      <UserButton />
      <div className="min-w-0">
        <p className="whitespace-normal break-words text-sm font-medium leading-snug text-foreground">
          {displayName}
        </p>
        {user?.email && displayName !== user.email && (
          <p className="break-all text-xs text-muted-foreground">{user.email}</p>
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
  );
}

export function ContentDashboardSidebar() {
  return (
    <aside className="sticky top-0 hidden h-svh w-72 shrink-0 self-start flex-col border-r border-border bg-white md:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-border px-5">
        <Link
          to="/"
          className="group flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Beyond Grades home"
        >
          <SiteBrandMark />
          <span className="whitespace-normal font-serif font-semibold leading-snug text-brand-dark transition-opacity group-hover:opacity-80">
            Beyond Grades
          </span>
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <ContentDashboardNavLinks />
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <DashboardAccountControl />
      </div>
    </aside>
  );
}
