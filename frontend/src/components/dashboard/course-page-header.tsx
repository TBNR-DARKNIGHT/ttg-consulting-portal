import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import type { CourseDefinition } from '@/lib/courses';

export function CoursePageHeader({
  course,
  contentLabel,
}: {
  course: CourseDefinition;
  contentLabel: string;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {course.shortLabel}
        </p>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {course.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{contentLabel}</p>
      </div>
      <Button variant="outline" asChild>
        <Link to="/dashboard">Dashboard</Link>
      </Button>
    </header>
  );
}
