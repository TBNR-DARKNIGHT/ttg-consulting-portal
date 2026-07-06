import { Link, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { ChevronRight, FileText, LockKeyhole, Video } from 'lucide-react';
import { useEntitlements } from '@/hooks/use-entitlements';
import {
  COURSES,
  COURSE_2_MODULES,
  type CourseId,
} from '@/lib/courses';
import { TTA_SHOP_URL } from '@/lib/tta-shop';
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
  const [expandedCourses, setExpandedCourses] = useState<Set<CourseId>>(() => new Set());
  const [collapsedCourses, setCollapsedCourses] = useState<Set<CourseId>>(() => new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => new Set());

  const isOpen = (courseId: CourseId) => {
    const active =
      pathname.startsWith(`/dashboard/course/${courseId}`) ||
      (pathname.startsWith('/dashboard/resources/') && resourceOrigin.courseId === courseId);
    return (active || expandedCourses.has(courseId)) && !collapsedCourses.has(courseId);
  };

  const toggleCourse = (courseId: CourseId) => {
    const open = isOpen(courseId);
    setExpandedCourses((current) => {
      const next = new Set(current);
      if (!open) next.add(courseId);
      return next;
    });
    setCollapsedCourses((current) => {
      const next = new Set(current);
      if (open) next.add(courseId);
      else next.delete(courseId);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-1">
      {COURSES.map((course) => {
        const locked = !hasCourseAccess(course.id);
        const open = !locked && isOpen(course.id);
        const courseActive =
          pathname.startsWith(`/dashboard/course/${course.id}`) ||
          (pathname.startsWith('/dashboard/resources/') &&
            resourceOrigin.courseId === course.id);
        const resourcesActive =
          pathname === `/dashboard/course/${course.id}/resources` ||
          (courseActive && resourceOrigin.from === 'resources');
        const videosActive =
          pathname === `/dashboard/course/${course.id}/videos` ||
          (courseActive && resourceOrigin.from === 'videos');
        const videosSectionKey = `${course.id}:videos`;
        const videosOpen =
          (videosActive || expandedSections.has(videosSectionKey)) &&
          !collapsedSections.has(videosSectionKey);

        return (
          <div key={course.id} className="rounded-md">
            <div
              className={cn(
                'group/sidebar-row flex items-center rounded-md pl-1 transition-colors',
                courseActive
                  ? 'bg-brand-indigo/10 text-brand-indigo'
                  : locked
                    ? 'hover:bg-brand-indigo/10'
                    : 'hover:bg-muted/80',
              )}
            >
              <button
                type="button"
                onClick={() => {
                  if (!locked) toggleCourse(course.id);
                }}
                disabled={locked}
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-md transition-colors group-hover/sidebar-row:text-foreground disabled:cursor-not-allowed disabled:opacity-35',
                  courseActive ? 'text-brand-indigo' : 'text-muted-foreground',
                )}
                aria-expanded={open}
                aria-label={
                  locked
                    ? `${course.shortLabel}: purchase access to expand`
                    : `${open ? 'Collapse' : 'Expand'} ${course.shortLabel}: ${course.title}`
                }
                title={locked ? 'Purchase access to unlock this course' : undefined}
              >
                <ChevronRight
                  className={cn(
                    'size-4 transition-transform',
                    open && 'rotate-90',
                  )}
                  aria-hidden
                />
              </button>
              {locked ? (
                <a
                  href={TTA_SHOP_URL}
                  onClick={onNavigate}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-2 pr-2 text-left transition-colors"
                  aria-label={`Purchase access to ${course.title}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block whitespace-normal break-words text-sm font-medium leading-snug text-foreground">
                      {course.shortLabel}: {course.title}
                    </span>
                    <span className="mt-0.5 block text-xs font-medium text-brand-indigo">
                      Purchase access
                    </span>
                  </span>
                  <LockKeyhole
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </a>
              ) : (
                <Link
                  to="/dashboard/course/$courseId"
                  params={{ courseId: course.id }}
                  search={{}}
                  onClick={() => {
                    setExpandedCourses((current) => new Set(current).add(course.id));
                    setCollapsedCourses((current) => {
                      const next = new Set(current);
                      next.delete(course.id);
                      return next;
                    });
                    onNavigate?.();
                  }}
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2 rounded-md py-2 pr-2 text-left text-sm font-medium transition-colors',
                    courseActive
                      ? 'text-brand-indigo'
                      : 'text-foreground',
                  )}
                >
                  <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
                    {course.shortLabel}: {course.title}
                  </span>
                </Link>
              )}
            </div>

            {open && !locked && course.id === 'course-1' && (
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

            {open && !locked && course.id === 'course-2' && (
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
                <div
                  className={cn(
                    'group/sidebar-row flex items-center gap-0.5 rounded-md transition-colors',
                    videosActive
                      ? 'bg-brand-indigo/10 text-brand-indigo'
                      : 'hover:bg-muted/80',
                  )}
                >
                  <Link
                    to="/dashboard/course/$courseId/videos"
                    params={{ courseId: course.id }}
                    search={{}}
                    onClick={() => {
                      setExpandedSections((current) =>
                        new Set(current).add(videosSectionKey),
                      );
                      setCollapsedSections((current) => {
                        const next = new Set(current);
                        next.delete(videosSectionKey);
                        return next;
                      });
                      onNavigate?.();
                    }}
                    className={cn(
                      'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                      videosActive
                        ? 'font-medium text-brand-indigo'
                        : 'text-muted-foreground group-hover/sidebar-row:text-foreground',
                    )}
                  >
                    <Video className="size-3.5 shrink-0 opacity-80" aria-hidden />
                    Videos
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedSections((current) => {
                        const next = new Set(current);
                        if (!videosOpen) next.add(videosSectionKey);
                        return next;
                      });
                      setCollapsedSections((current) => {
                        const next = new Set(current);
                        if (videosOpen) next.add(videosSectionKey);
                        else next.delete(videosSectionKey);
                        return next;
                      });
                    }}
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-md transition-colors group-hover/sidebar-row:text-foreground',
                      videosActive ? 'text-brand-indigo' : 'text-muted-foreground',
                    )}
                    aria-expanded={videosOpen}
                    aria-label={`${videosOpen ? 'Collapse' : 'Expand'} Videos`}
                  >
                    <ChevronRight
                      className={cn(
                        'size-3.5 transition-transform',
                        videosOpen && 'rotate-90',
                      )}
                      aria-hidden
                    />
                  </button>
                </div>

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
