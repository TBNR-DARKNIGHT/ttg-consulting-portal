import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/course/$courseId')({
  component: CourseLayout,
});

function CourseLayout() {
  return <Outlet />;
}
