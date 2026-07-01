import { Link, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { FileText, LockKeyhole, Video } from 'lucide-react';
import { useEntitlements } from '@/hooks/use-entitlements';
import { COURSES, type CourseId } from '@/lib/courses';
import { cn } from '@/lib/utils';

const CHEVRON_COLLAPSED = '\u25B6';
const CHEVRON_EXPANDED = '\u25BC';

function dashboardHomePath(pathname: string) {
  return pathname === '/dashboard' || pathname === '/dashboard/';
}

export function DashboardCourseSidebarSection({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [overrideOpen, setOverrideOpen] = useState<Partial<Record<CourseId, boolean>>>({});
  const { hasCourseAccess } = useEntitlements();

  const isOpen = (courseId: CourseId) => {
    if (pathname.includes(`/course/${courseId}/`)) return true;
    if (courseId in overrideOpen) return overrideOpen[courseId]!;
    if (courseId === 'course-1' && dashboardHomePath(pathname)) return true;
    return false;
  };

  const toggle = (courseId: CourseId) => {
    if (pathname.includes(`/course/${courseId}/`)) return;
    const currently = isOpen(courseId);
    setOverrideOpen((o) => ({ ...o, [courseId]: !currently }));
  };

  return (
    <div className="flex flex-col gap-1 px-3 pb-2">
      {COURSES.map((course) => {
        const open = isOpen(course.id);
        const locked = !hasCourseAccess(course.id);
        const resourcesActive = pathname === `/dashboard/course/${course.id}/resources`;
        const videosActive = pathname === `/dashboard/course/${course.id}/videos`;

        return (
          <div key={course.id} className="rounded-md">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
              onClick={() => toggle(course.id)}
              aria-expanded={open}
            >
              <span className="font-mono text-xs text-muted-foreground" aria-hidden>
                {open ? CHEVRON_EXPANDED : CHEVRON_COLLAPSED}
              </span>
              <span className="min-w-0 flex-1 truncate">{course.shortLabel}</span>
              {locked && (
                <LockKeyhole
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-label="Locked"
                />
              )}
            </button>

            {open && (
              <div className="ml-4 flex flex-col gap-0.5 border-l border-border pl-2">
                <Link
                  to="/dashboard/course/$courseId/resources"
                  params={{ courseId: course.id }}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    resourcesActive
                      ? 'bg-brand-indigo/10 font-medium text-brand-indigo'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                  )}
                >
                  <FileText className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  Resources
                </Link>
                <Link
                  to="/dashboard/course/$courseId/videos"
                  params={{ courseId: course.id }}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    videosActive
                      ? 'bg-brand-indigo/10 font-medium text-brand-indigo'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                  )}
                >
                  <Video className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  Video
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
