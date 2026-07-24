import { createFileRoute, Navigate, Outlet, useRouterState } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/resources')({
  component: ResourcesLayout,
});

function ResourcesLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isResourcesRoot =
    pathname === '/dashboard/resources' || pathname === '/dashboard/resources/';

  if (isResourcesRoot) {
    return (
      <Navigate
        to="/dashboard/course/$courseId/resources"
        params={{ courseId: 'course-1' }}
        replace
      />
    );
  }

  return <Outlet />;
}
