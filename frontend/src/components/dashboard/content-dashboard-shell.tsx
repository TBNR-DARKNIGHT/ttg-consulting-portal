import { useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Menu } from 'lucide-react';
import {
  DashboardAccountControl,
  ContentDashboardNavLinks,
  ContentDashboardSidebar,
} from '@/components/dashboard/content-dashboard-sidebar';
import { SiteBrandMark } from '@/components/layout/site-brand-mark';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function ContentDashboardShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-white text-foreground">
      <ContentDashboardSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-auto bg-white">
        <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-white/90 px-4 backdrop-blur-md md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-1">
                <Menu className="size-5" />
                <span className="sr-only">Open dashboard menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex h-full w-72 flex-col p-0">
              <SheetTitle className="sr-only">Dashboard</SheetTitle>
              <SheetDescription className="sr-only">Dashboard navigation</SheetDescription>
              <div className="flex h-14 shrink-0 items-center border-b border-border px-5">
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="group flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Beyond Grades home"
                >
                  <SiteBrandMark />
                  <span className="truncate font-serif font-semibold text-brand-dark transition-opacity group-hover:opacity-80">
                    Beyond Grades
                  </span>
                </Link>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <ContentDashboardNavLinks onNavigate={() => setOpen(false)} />
              </div>
              <div className="mt-auto shrink-0 border-t border-border p-3">
                <DashboardAccountControl />
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0 truncate font-medium text-foreground">Dashboard</div>
        </div>
        {children}
      </div>
    </div>
  );
}
