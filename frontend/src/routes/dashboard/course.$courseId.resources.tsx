import { createFileRoute, Navigate } from '@tanstack/react-router';
import { CoursePageHeader } from '@/components/dashboard/course-page-header';
import { DashboardResourceGrid } from '@/components/dashboard/dashboard-resource-grid';
import { LockedCourseAccess } from '@/components/dashboard/locked-course-access';
import { useEntitlements } from '@/hooks/use-entitlements';
import { getCourseById } from '@/lib/courses';

export const Route = createFileRoute('/dashboard/course/$courseId/resources')({
  validateSearch: (search: Record<string, unknown>): { module?: string } =>
    typeof search.module === 'string' ? { module: search.module } : {},
  component: CourseResourcesPage,
});

function CourseResourcesPage() {
  const { courseId } = Route.useParams();
  const { module: moduleId } = Route.useSearch();
  const course = getCourseById(courseId);
  const { hasCourseAccess, isLoading } = useEntitlements();

  if (!course) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <CoursePageHeader course={course} contentLabel="Resources" />

        {!isLoading && !hasCourseAccess(course.id) ? (
          <LockedCourseAccess />
        ) : (
          <DashboardResourceGrid
            courseId={course.id}
            topics={course.topics}
            resourceTypes={['pdf']}
            moduleId={course.id === 'course-2' ? (moduleId ?? null) : undefined}
          />
        )}
      </div>
    </main>
  );
}
