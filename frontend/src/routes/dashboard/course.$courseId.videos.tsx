import { createFileRoute, Navigate } from '@tanstack/react-router';
import { CoursePageHeader } from '@/components/dashboard/course-page-header';
import { DashboardResourceGrid } from '@/components/dashboard/dashboard-resource-grid';
import { LockedCourseAccess } from '@/components/dashboard/locked-course-access';
import { useEntitlements } from '@/hooks/use-entitlements';
import { COURSE_2_MODULES, getCourseById } from '@/lib/courses';

export const Route = createFileRoute('/dashboard/course/$courseId/videos')({
  validateSearch: (search: Record<string, unknown>): { module?: string } =>
    typeof search.module === 'string' ? { module: search.module } : {},
  component: CourseVideosPage,
});

function CourseVideosPage() {
  const { courseId } = Route.useParams();
  const { module: moduleId } = Route.useSearch();
  const course = getCourseById(courseId);
  const selectedModule = moduleId
    ? COURSE_2_MODULES.find((module) => module.id === moduleId)
    : undefined;
  const { hasCourseAccess, isLoading } = useEntitlements();

  if (!course) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <CoursePageHeader
          course={course}
          contentLabel={selectedModule ? `Videos · ${selectedModule.title}` : 'Videos'}
        />

        {!isLoading && !hasCourseAccess(course.id) ? (
          <LockedCourseAccess />
        ) : course.id !== 'course-2' || moduleId ? (
          <DashboardResourceGrid
            courseId={course.id}
            topics={course.topics}
            resourceTypes={['video']}
            moduleId={course.id === 'course-2' ? (moduleId ?? null) : undefined}
          />
        ) : (
          <div className="space-y-10">
            <section className="space-y-4">
              <h2 className="font-serif text-xl font-semibold text-foreground">
                Course Videos
              </h2>
              <DashboardResourceGrid
                courseId={course.id}
                topics={course.topics}
                resourceTypes={['video']}
                moduleId={null}
              />
            </section>
            {COURSE_2_MODULES.map((module) => (
              <section key={module.id} className="space-y-4 border-t border-border pt-8">
                <h2 className="font-serif text-xl font-semibold text-foreground">
                  {module.title}
                </h2>
              <DashboardResourceGrid
                courseId={course.id}
                topics={course.topics}
                  resourceTypes={['video']}
                  moduleId={module.id}
                />
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
