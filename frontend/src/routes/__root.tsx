import { useEffect } from 'react';
import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router';
import { ActivityTracker } from '@/components/analytics/activity-tracker';
import { Toaster } from '@/components/ui/sonner';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const location = useRouterState({ select: (state) => state.location });

  useEffect(() => {
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    const frame = window.requestAnimationFrame(resetScroll);
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.search]);

  return (
    <>
      <ActivityTracker />
      <Outlet />
      <Toaster
        position="bottom-right"
        richColors
        duration={5000}
        swipeDirections={[]}
        toastOptions={{ className: 'pointer-events-none select-none' }}
      />
    </>
  );
}
