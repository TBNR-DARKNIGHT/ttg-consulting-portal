import { Link, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { ChevronRight, FileText, LockKeyhole, Video } from 'lucide-react';
import { useEntitlements } from '@/hooks/use-entitlements';
import {
  COURSES,
  COURSE_2_MODULES,
  type CourseId,
} from '@/lib/courses';
import { cn } from '@/lib/utils';

export function DashboardCourseSidebarSection({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const selectedModule = useRouterState({
    select: (s) => {
      const module = s.location.search.module;
      return typeof module === 'string' ? module : undefined;
    },
  });
  const resourceOrigin = useRouterState({
    select: (s) => {
      const { courseId, from } = s.location.search;
      return {
        courseId: typeof courseId === 'string' ? courseId : undefined,
        from: from === 'overview' || from === 'resources' || from === 'videos' ? from : undefined,
      };
    },
  });
  const { hasCourseAccess } = useEntitlements();
  const [collapsedCourses, setCollapsedCourses] = useState<Set<CourseId>>(() => new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => new Set());

  const isOpen = (courseId: CourseId) => {
    const active =
      pathname.startsWith(`/dashboard/course/${courseId}`) ||
      (pathname.startsWith('/dashboard/resources/') && resourceOrigin.courseId === courseId);
    return active && !collapsedCourses.has(courseId);
  };

  return (
    <div className="flex flex-col gap-1">
      {COURSES.map((course) => {
        const open = isOpen(course.id);
        const locked = !hasCourseAccess(course.id);
        const courseActive =
          pathname.startsWith(`/dashboard/course/${course.id}`) ||
          (pathname.startsWith('/dashboard/resources/') &&
            resourceOrigin.courseId === course.id);
        const courseOverviewActive =
          pathname === `/dashboard/course/${course.id}` ||
          pathname === `/dashboard/course/${course.id}/`;
        const resourcesActive =
          pathname === `/dashboard/course/${course.id}/resources` ||
          (courseActive && resourceOrigin.from === 'resources');
        const videosActive =
          pathname === `/dashboard/course/${course.id}/videos` ||
          (courseActive && resourceOrigin.from === 'videos');
        const videosOpen = videosActive && !collapsedSections.has(`${course.id}:videos`);

        return (
          <div key={course.id} className="rounded-md">
            <Link
              to="/dashboard/course/$courseId"
              params={{ courseId: course.id }}
              search={{}}
              onClick={(event) => {
                if (courseOverviewActive) {
                  event.preventDefault();
                  setCollapsedCourses((current) => {
                    const next = new Set(current);
                    if (next.has(course.id)) next.delete(course.id);
                    else next.add(course.id);
                    return next;
                  });
                  return;
                }
                setCollapsedCourses((current) => {
                  const next = new Set(current);
                  next.delete(course.id);
                  return next;
                });
                setCollapsedSections((current) => {
                  const next = new Set(current);
                  next.delete(`${course.id}:videos`);
                  return next;
                });
                onNavigate?.();
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
                courseOverviewActive
                  ? 'bg-brand-indigo/10 text-brand-indigo'
                  : 'text-foreground hover:bg-muted/80',
              )}
              aria-expanded={open}
            >
              <ChevronRight
                className={cn(
                  'size-4 shrink-0 text-muted-foreground transition-transform',
                  open && 'rotate-90',
                )}
                aria-hidden
              />
              <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
                {course.shortLabel}: {course.title}
              </span>
              {locked && (
                <LockKeyhole
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-label="Locked"
                />
              )}
            </Link>

            {open && course.id === 'course-1' && (
              <div className="ml-2 flex flex-col gap-0.5 border-l border-border pl-1">
                <Link
                  to="/dashboard/course/$courseId/resources"
                  params={{ courseId: course.id }}
                  search={{}}
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
                  search={{}}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    videosActive && !selectedModule
                      ? 'bg-brand-indigo/10 font-medium text-brand-indigo'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                  )}
                >
                  <Video className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  Videos
                </Link>
              </div>
            )}

            {open && course.id === 'course-2' && (
              <div className="ml-2 flex flex-col gap-0.5 border-l border-border pl-1">
                <Link
                  to="/dashboard/course/$courseId/resources"
                  params={{ courseId: course.id }}
                  search={{}}
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
                  search={{}}
                  onClick={(event) => {
                    const basePageActive =
                      pathname === `/dashboard/course/${course.id}/videos` && !selectedModule;
                    if (basePageActive) {
                      event.preventDefault();
                      setCollapsedSections((current) => {
                        const next = new Set(current);
                        const key = `${course.id}:videos`;
                        if (next.has(key)) next.delete(key);
                        else next.add(key);
                        return next;
                      });
                      return;
                    }
                    setCollapsedSections((current) => {
                      const next = new Set(current);
                      next.delete(`${course.id}:videos`);
                      return next;
                    });
                    onNavigate?.();
                  }}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    videosActive && !selectedModule
                      ? 'bg-brand-indigo/10 font-medium text-brand-indigo'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                  )}
                >
                  <Video className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  Videos
                  <ChevronRight
                    className={cn(
                      'ml-auto size-3.5 shrink-0 transition-transform',
                      videosOpen && 'rotate-90',
                    )}
                    aria-hidden
                  />
                </Link>

                {videosOpen && (
                  <div className="ml-2 flex flex-col gap-0.5 border-l border-border pl-1">
                    {COURSE_2_MODULES.map((module) => (
                      <Link
                        key={module.id}
                        to="/dashboard/course/$courseId/videos"
                        params={{ courseId: course.id }}
                        search={{ module: module.id }}
                        onClick={onNavigate}
                        className={cn(
                          'rounded-md px-2 py-1.5 text-sm transition-colors',
                          selectedModule === module.id
                            ? 'bg-brand-indigo/10 font-medium text-brand-indigo'
                            : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                        )}
                      >
                        {module.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
