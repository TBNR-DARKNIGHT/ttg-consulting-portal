import { useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import {
  ContentDashboardNavLinks,
  ContentDashboardSidebar,
} from '@/components/dashboard/content-dashboard-sidebar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { usePortalAuth } from '@/auth/auth-context';

export function ContentDashboardShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { signOut } = usePortalAuth();

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
              <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-indigo text-sm font-semibold tracking-tight text-white">
                  bg
                </div>
                <span className="truncate font-serif font-semibold text-brand-dark">beyond grades</span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <ContentDashboardNavLinks onNavigate={() => setOpen(false)} />
              </div>
              <div className="mt-auto shrink-0 border-t border-border p-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setOpen(false);
                    void signOut();
                  }}
                >
                  Sign out
                </Button>
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
