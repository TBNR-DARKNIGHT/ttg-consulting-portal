import { createFileRoute, Link, Navigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { DashboardResourceGrid } from '@/components/dashboard/dashboard-resource-grid';
import { getCourseById } from '@/lib/courses';

export const Route = createFileRoute('/dashboard/course/$courseId/videos')({
  component: CourseVideosPage,
});

function CourseVideosPage() {
  const { courseId } = Route.useParams();
  const course = getCourseById(courseId);

  if (!course) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {course.shortLabel}
            </p>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Video
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{course.title}</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/">Home</Link>
          </Button>
        </header>

        <DashboardResourceGrid topics={course.topics} resourceTypes={['video']} />
      </div>
    </main>
  );
}
