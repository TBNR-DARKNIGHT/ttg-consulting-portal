import { useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Mail, Menu } from 'lucide-react';
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
        <div className="border-b border-brand-indigo/15 bg-brand-indigo/[0.04] px-4 py-2">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-2 text-sm text-brand-dark sm:flex-row sm:items-center sm:justify-center">
            <span className="leading-snug">
              Want a personalised DSA strategy? Book a consultation with us.
            </span>
            <Button
              asChild
              size="sm"
              className="h-8 shrink-0 gap-1.5 rounded-md bg-brand-indigo px-3 text-xs font-semibold text-white hover:bg-brand-indigo/90"
            >
              <a href="mailto:beyondgrades@thinkteachacademy.com">
                <Mail className="size-3.5" aria-hidden />
                Book Now
              </a>
            </Button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
