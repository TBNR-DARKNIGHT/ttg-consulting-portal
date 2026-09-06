import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  Download,
  RefreshCw,
  Repeat2,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { usePortalAuth } from '@/auth/auth-context';
import { getAuthMode, usesDemoAuthProvider } from '@/auth/env';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  createAdminAnalyticsIgnoredUser,
  deleteAdminAnalyticsIgnoredUser,
  getAdminAnalytics,
  getAdminAnalyticsIgnoredUsers,
  type AdminAnalyticsKpi,
  type AdminAnalyticsPeriodType,
  type AdminAnalyticsSummary,
  type AdminAnalyticsTrendPoint,
  type AdminAnalyticsUserMetric,
} from '@/lib/api';
import {
  analyticsPeriodDayKeys,
  analyticsPeriodLabel,
  analyticsPeriodOptions,
  analyticsPeriodStart,
  nextAnalyticsPeriodStart,
  singaporeTodayKey,
} from '@/lib/analytics-periods';
import { cn } from '@/lib/utils';

const kpiIcons = [UserCheck, Users, BookOpenCheck, Repeat2, Activity, TrendingUp];

function demoAnalyticsSummary(
  periodType: AdminAnalyticsPeriodType,
  selectedPeriodStart: string,
  courseId: string | undefined,
): AdminAnalyticsSummary {
  const kpis: AdminAnalyticsKpi[] = [
    {
      label: 'Meaningfully engaged',
      value: '9',
      detail: '75.0% of course-active users',
      tone: 'positive',
    },
    {
      label: 'Course active users',
      value: '12',
      detail: '14 signed-in active users',
      tone: 'positive',
    },
    {
      label: 'Resource completions',
      value: '11',
      detail: '7 unique completers',
      tone: 'neutral',
    },
    {
      label: 'Repeat engagement',
      value: '58.3%',
      detail: '7 users active on 2+ days',
      tone: 'neutral',
    },
    {
      label: 'Paid adoption',
      value: '75.0%',
      detail: '6 of 8 eligible users',
      tone: 'positive',
    },
    {
      label: 'Average progress',
      value: '54.8%',
      detail: 'Across 18 started user-resources',
      tone: 'neutral',
    },
  ];

  const generatedAt = new Date().toISOString();
  const nextPeriodStart = nextAnalyticsPeriodStart(periodType, selectedPeriodStart);
  const periodStart = `${selectedPeriodStart}T00:00:00+08:00`;
  const periodEnd =
    nextPeriodStart <= singaporeTodayKey() ? `${nextPeriodStart}T00:00:00+08:00` : generatedAt;
  const trendDays = analyticsPeriodDayKeys(periodType, selectedPeriodStart);

  return {
    periodType,
    selectedPeriodStart,
    periodLabel: analyticsPeriodLabel(periodType, selectedPeriodStart),
    dataAvailableFrom: `${singaporeTodayKey().slice(0, 4)}-01-01`,
    selectedCourseId: courseId ?? null,
    periodStart,
    periodEnd,
    generatedAt,
    eventCount: 128,
    userCount: 24,
    paidUserCount: 8,
    activeUserCount: 16,
    signedInActiveUserCount: 14,
    courseOptions: [
      { courseId: 'course-1', label: 'Course 1' },
      { courseId: 'course-2', label: 'Course 2' },
    ],
    courseEngagement: {
      courseId: courseId ?? null,
      label: courseId
        ? courseId.replace('-', ' ').replace(/\b\w/g, (value) => value.toUpperCase())
        : 'All courses',
      courseActiveUsers: 12,
      meaningfullyEngagedUsers: 9,
      meaningfulEngagementRate: 75,
      resourceStarters: 18,
      resourceCompletions: 11,
      uniqueCompleters: 7,
      averageProgress: 54.8,
      medianProgress: 51,
      repeatUsers: 7,
      repeatEngagementRate: 58.3,
      contentEngagementTimeMs: 4_320_000,
      paidEligibleUsers: 8,
      paidActivatedUsers: 6,
      paidAdoptionRate: 75,
    },
    funnel: [
      { label: 'Signed-in active', users: 14, conversionRate: 100 },
      { label: 'Course active', users: 12, conversionRate: 85.7 },
      { label: 'Meaningfully engaged', users: 9, conversionRate: 64.3 },
      { label: 'Completed a resource', users: 7, conversionRate: 50 },
    ],
    kpis,
    trend: trendDays.map((date, index) => ({
      date,
      activeUsers: (index % 7) + 1,
      signedInActiveUsers: (index % 6) + 1,
      courseActiveUsers: (index % 5) + 1,
      meaningfullyEngagedUsers: (index % 4) + 1,
      sessions: (index % 5) + 2,
      pageViews: (index % 9) + 3,
      resourceViews: (index % 6) + 2,
      clicks: (index % 4) + 1,
      completions: index % 3,
    })),
    topResources: [
      {
        resourceId: 'demo-resource-1',
        title: 'Interview Practice',
        courseId: 'course-2',
        type: 'video',
        views: 31,
        uniqueUsers: 11,
        viewsPerUser: 2.82,
        starterUsers: 9,
        completedUsers: 6,
        completionRate: 66.7,
        averageProgress: 71.2,
        medianProgress: 75,
        repeatViewers: 5,
      },
      {
        resourceId: 'demo-resource-2',
        title: 'DSA Timeline Checklist',
        courseId: 'course-1',
        type: 'pdf',
        views: 24,
        uniqueUsers: 18,
        viewsPerUser: 1.33,
        starterUsers: 8,
        completedUsers: 5,
        completionRate: 62.5,
        averageProgress: 51.4,
        medianProgress: 50,
        repeatViewers: 3,
      },
    ],
    topUsers: [
      {
        userId: 'demo-paid-parent',
        label: 'Paid Parent',
        email: 'paid.parent@example.com',
        sessions: 5,
        events: 38,
        resourceViews: 18,
        clicks: 6,
        avgSessionTimeMs: 492000,
        lastSeenAt: new Date().toISOString(),
        paidCourses: ['course-2'],
        distinctResources: 4,
        maxProgress: 100,
        completedResources: 3,
        contentEngagementMs: 1_200_000,
      },
    ],
    lowEngagementUsers: [
      {
        userId: 'demo-quiet-parent',
        label: 'Quiet Parent',
        email: 'quiet.parent@example.com',
        sessions: 0,
        events: 0,
        resourceViews: 0,
        clicks: 0,
        avgSessionTimeMs: 0,
        lastSeenAt: null,
        paidCourses: [],
        distinctResources: 0,
        maxProgress: 0,
        completedResources: 0,
        contentEngagementMs: 0,
      },
    ],
    paidInactiveUsers: [
      {
        userId: 'demo-paid-inactive',
        label: 'Inactive Paid Parent',
        email: 'inactive.paid@example.com',
        sessions: 0,
        events: 0,
        resourceViews: 0,
        clicks: 0,
        avgSessionTimeMs: 0,
        lastSeenAt: null,
        paidCourses: ['course-2'],
        distinctResources: 0,
        maxProgress: 0,
        completedResources: 0,
        contentEngagementMs: 0,
      },
    ],
    topPages: [{ label: 'Portal', path: '/portal', views: 22, uniqueUsers: 14 }],
    topClicks: [{ label: 'Purchase Access', clicks: 8, path: '/dashboard/settings' }],
    topReferrers: [{ source: 'https://google.com', visits: 6 }],
    topCampaigns: [
      {
        source: 'instagram',
        medium: 'social',
        campaign: 'dsa-guide',
        sessions: 8,
        visitors: 7,
        signedInUsers: 4,
        courseActiveUsers: 3,
      },
    ],
    recentEvents: [
      {
        eventType: 'resource_view',
        occurredAt: new Date().toISOString(),
        userLabel: 'Paid Parent',
        pagePath: '/dashboard/resources/demo-resource-1',
        resourceTitle: 'Interview Practice',
      },
    ],
  };
}

function formatDate(value: string | null) {
  if (!value) return 'No activity';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDuration(milliseconds: number) {
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours) return `${hours}h ${minutes % 60}m`;
  if (minutes) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatPeriod(summary: AdminAnalyticsSummary) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    timeZone: 'Asia/Singapore',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const periodEnd = new Date(summary.periodEnd);
  const generatedAt = new Date(summary.generatedAt);
  const displayEnd = periodEnd < generatedAt ? new Date(periodEnd.getTime() - 1) : periodEnd;
  const label = analyticsPeriodLabel(summary.periodType, summary.selectedPeriodStart);
  return `${label} | ${formatter.format(new Date(summary.periodStart))} to ${formatter.format(displayEnd)}`;
}

function maxTrendValue(trend: AdminAnalyticsTrendPoint[]) {
  return Math.max(
    1,
    ...trend.map((point) =>
      Math.max(point.courseActiveUsers, point.meaningfullyEngagedUsers, point.completions),
    ),
  );
}

function exportCsv(summary: AdminAnalyticsSummary) {
  const rows = [
    ['section', 'label', 'value', 'detail'],
    ...summary.kpis.map((kpi) => ['kpi', kpi.label, kpi.value, kpi.detail ?? '']),
    ...summary.topResources.map((resource) => [
      'resource',
      resource.title,
      String(resource.uniqueUsers),
      `${resource.starterUsers} starters; ${resource.completedUsers} completions; ${resource.averageProgress}% average progress`,
    ]),
    ...summary.topUsers.map((user) => [
      'user',
      user.label,
      String(user.distinctResources),
      `${user.completedResources} completions; ${user.maxProgress}% maximum progress`,
    ]),
    ...summary.funnel.map((step) => [
      'funnel',
      step.label,
      String(step.users),
      `${step.conversionRate}% of signed-in active users`,
    ]),
  ];
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `bg-analytics-${summary.periodType}-${summary.selectedPeriodStart}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function MiniTrend({ trend }: { trend: AdminAnalyticsTrendPoint[] }) {
  const max = maxTrendValue(trend);
  const compact = trend.length > 45 ? trend.filter((_, index) => index % 3 === 0) : trend;
  const labelEvery = compact.length > 31 ? 5 : compact.length > 14 ? 3 : 1;

  const formatTrendDate = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
    }).format(new Date(`${value}T00:00:00`));

  const renderBar = (
    point: AdminAnalyticsTrendPoint,
    metric: string,
    value: number,
    color: string,
  ) => (
    <span className="group/bar relative flex h-full w-2 items-end justify-center">
      <span
        className={cn('w-1.5 rounded-t transition-opacity group-hover/bar:opacity-80', color)}
        title={`${formatTrendDate(point.date)}: ${metric} ${value}`}
        style={{ height: `${Math.max(3, (value / max) * 100)}%` }}
      />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-36 -translate-x-1/2 rounded-md border border-border bg-white px-2 py-1.5 text-left text-[11px] leading-4 text-foreground shadow-lg group-hover/bar:block">
        <span className="block font-medium">{formatTrendDate(point.date)}</span>
        <span className="block text-muted-foreground">{metric}</span>
        <span className="block font-semibold">{value}</span>
      </span>
    </span>
  );

  return (
    <div className="h-60 overflow-visible rounded-md border border-border bg-white p-4">
      <div className="flex h-full items-end gap-1">
        {compact.map((point, index) => (
          <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex h-40 w-full items-end justify-center gap-0.5">
              {renderBar(point, 'Course active', point.courseActiveUsers, 'bg-brand-indigo')}
              {renderBar(
                point,
                'Meaningfully engaged',
                point.meaningfullyEngagedUsers,
                'bg-emerald-500',
              )}
              {renderBar(point, 'Completions', point.completions, 'bg-amber-500')}
            </div>
            <span className="h-7 text-[10px] leading-3 text-muted-foreground">
              {index % labelEvery === 0 || index === compact.length - 1
                ? formatTrendDate(point.date)
                : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="py-6 text-sm text-muted-foreground">{label}</p>;
}

function AnalyticsListCard({
  title,
  description,
  children,
  className,
  contentClassName,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn('flex h-[26rem] flex-col overflow-hidden shadow-sm', className)}>
      <CardHeader className="shrink-0">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="min-h-0 flex-1 px-6">
        <div
          className={cn(
            'h-full overflow-y-auto overscroll-contain rounded-md border border-border bg-muted/20 p-4 [scrollbar-gutter:stable]',
            contentClassName,
          )}
        >
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

function UserRows({ users }: { users: AdminAnalyticsUserMetric[] }) {
  if (!users.length) return <EmptyState label="No users in this segment yet." />;

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <div key={user.userId} className="rounded-md border border-border p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{user.label}</p>
              {user.email && (
                <p className="break-all text-xs text-muted-foreground">{user.email}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Last seen {formatDate(user.lastSeenAt)}
              </p>
            </div>
            {user.paidCourses.length > 0 && <Badge>Paid</Badge>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div>
              <p className="font-medium">{user.distinctResources}</p>
              <p className="text-muted-foreground">resources</p>
            </div>
            <div>
              <p className="font-medium">{user.maxProgress}%</p>
              <p className="text-muted-foreground">max progress</p>
            </div>
            <div>
              <p className="font-medium">{user.completedResources}</p>
              <p className="text-muted-foreground">completed</p>
            </div>
            <div>
              <p className="font-medium">{formatDuration(user.contentEngagementMs)}</p>
              <p className="text-muted-foreground">visible time</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminAnalyticsDashboard() {
  const { getToken } = usePortalAuth();
  const queryClient = useQueryClient();
  const [periodType, setPeriodType] = useState<AdminAnalyticsPeriodType>('month');
  const [selectedPeriodStart, setSelectedPeriodStart] = useState(() =>
    analyticsPeriodStart('month', singaporeTodayKey()),
  );
  const [courseId, setCourseId] = useState('');
  const [ignoreTarget, setIgnoreTarget] = useState('');
  const [ignoreReason, setIgnoreReason] = useState('');
  const demo = usesDemoAuthProvider(getAuthMode());
  const analytics = useQuery({
    queryKey: ['admin-analytics', periodType, selectedPeriodStart, courseId],
    queryFn: () =>
      demo
        ? Promise.resolve(
            demoAnalyticsSummary(periodType, selectedPeriodStart, courseId || undefined),
          )
        : getAdminAnalytics(
            {
              periodType,
              periodStart: selectedPeriodStart,
              courseId: courseId || undefined,
            },
            getToken,
          ),
    staleTime: 60_000,
  });

  const summary = analytics.data;
  const periodOptions = useMemo(
    () => analyticsPeriodOptions(periodType, summary?.dataAvailableFrom ?? null),
    [periodType, summary?.dataAvailableFrom],
  );
  const ignoredUsers = useQuery({
    queryKey: ['admin-analytics-ignored-users'],
    queryFn: () => (demo ? Promise.resolve([]) : getAdminAnalyticsIgnoredUsers(getToken)),
    staleTime: 60_000,
  });
  const createIgnoredUser = useMutation({
    mutationFn: () => {
      const target = ignoreTarget.trim();
      const input = target.includes('@') ? { email: target } : { userId: target };
      return createAdminAnalyticsIgnoredUser(
        {
          ...input,
          ...(ignoreReason.trim() ? { reason: ignoreReason.trim() } : {}),
        },
        getToken,
      );
    },
    onSuccess: async () => {
      setIgnoreTarget('');
      setIgnoreReason('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-analytics-ignored-users'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-analytics'] }),
      ]);
    },
  });
  const deleteIgnoredUser = useMutation({
    mutationFn: (id: string) => deleteAdminAnalyticsIgnoredUser(id, getToken),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-analytics-ignored-users'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-analytics'] }),
      ]);
    },
  });
  const generatedAt = useMemo(() => (summary ? formatDate(summary.generatedAt) : ''), [summary]);

  return (
    <main className="mx-auto w-full max-w-[82rem] space-y-6 px-6 py-8 md:px-10 md:py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand-indigo">
            <BarChart3 className="size-4" aria-hidden />
            Admin analytics
          </div>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">
            Learning & Growth Analytics
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Monitor course adoption, user engagement, content demand, and follow-up opportunities
            from the raw activity log.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            aria-label="Filter by course"
            className="h-9 max-w-48 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">All courses</option>
            {(summary?.courseOptions ?? []).map((course) => (
              <option key={course.courseId} value={course.courseId}>
                {course.label}
              </option>
            ))}
          </select>
          <Tabs
            value={periodType}
            onValueChange={(value) => {
              const nextPeriodType = value as AdminAnalyticsPeriodType;
              setPeriodType(nextPeriodType);
              setSelectedPeriodStart(analyticsPeriodStart(nextPeriodType, singaporeTodayKey()));
            }}
          >
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="quarter">Quarter</TabsTrigger>
            </TabsList>
          </Tabs>
          <select
            value={selectedPeriodStart}
            onChange={(event) => setSelectedPeriodStart(event.target.value)}
            aria-label="Analytics period"
            className="h-9 min-w-32 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {periodOptions.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="icon"
            title="Refresh analytics"
            aria-label="Refresh analytics"
            onClick={() => void analytics.refetch()}
          >
            <RefreshCw className={cn('size-4', analytics.isFetching && 'animate-spin')} />
          </Button>
          {summary && (
            <Button
              variant="outline"
              size="icon"
              title="Download CSV"
              aria-label="Download CSV"
              onClick={() => exportCsv(summary)}
            >
              <Download className="size-4" />
            </Button>
          )}
        </div>
      </header>

      {analytics.isLoading && <p className="text-sm text-muted-foreground">Loading analytics...</p>}
      {analytics.isError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Unable to load analytics. Confirm the analytics migrations are applied and your account is
          an admin.
        </p>
      )}

      {summary && (
        <>
          <section className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-border py-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4" aria-hidden />
              {formatPeriod(summary)}
            </span>
            <span>{summary.courseEngagement.label}</span>
            <span>{summary.activeUserCount} total site visitors</span>
          </section>
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {summary.kpis.map((kpi, index) => {
              const Icon = kpiIcons[index] ?? TrendingUp;
              return (
                <Card key={kpi.label} className="min-h-40 py-0 shadow-sm md:aspect-square">
                  <CardContent className="grid h-full grid-rows-[2.5rem_1fr_2rem] gap-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-2 text-[15px] font-medium leading-5 text-muted-foreground">
                        {kpi.label}
                      </p>
                      <Icon className="size-4 text-brand-indigo" aria-hidden />
                    </div>
                    <p className="self-center text-3xl font-semibold leading-none tracking-tight">
                      {kpi.value}
                    </p>
                    <p className="line-clamp-2 self-end text-[13px] leading-4 text-muted-foreground">
                      {kpi.detail ?? ''}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <section>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Engagement Trend</CardTitle>
                <CardDescription>
                  Course activity, meaningful engagement, and completions by Singapore calendar day.
                  Last generated {generatedAt}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <MiniTrend trend={summary.trend} />
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span className="size-2 rounded-full bg-brand-indigo" /> Course active
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="size-2 rounded-full bg-emerald-500" /> Meaningfully engaged
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="size-2 rounded-full bg-amber-500" /> Completions
                  </span>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <AnalyticsListCard
              title="Resource Performance"
              description="Reach, progress, repeat use, and completion for the selected course."
              className="h-[30rem]"
            >
              {summary.topResources.length === 0 ? (
                <EmptyState label="No resource views captured yet." />
              ) : (
                <div className="space-y-3">
                  {summary.topResources.map((resource) => (
                    <div key={resource.resourceId ?? resource.title} className="space-y-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{resource.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {resource.courseId ?? 'No course'} | {resource.type ?? 'resource'}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">{resource.uniqueUsers} viewers</p>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{
                            width: `${resource.averageProgress}%`,
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{resource.views} opens</span>
                        <span>{resource.starterUsers} starters</span>
                        <span>{resource.completedUsers} completed</span>
                        <span>{resource.averageProgress}% average progress</span>
                        <span>{resource.completionRate}% starter completion</span>
                        <span>{resource.repeatViewers} repeat viewers</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AnalyticsListCard>

            <AnalyticsListCard
              title="Most Engaged Users"
              description="Signed-in users with the strongest course progress in this period."
              className="h-[30rem]"
            >
              <UserRows users={summary.topUsers} />
            </AnalyticsListCard>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <AnalyticsListCard
              title="Course Engagement Funnel"
              description="Period reach at each stricter level of signed-in course engagement."
              className="h-[24rem]"
            >
              <div className="space-y-4">
                {summary.funnel.map((step) => (
                  <div key={step.label} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{step.label}</span>
                      <span>
                        {step.users} <span className="text-muted-foreground">users</span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-brand-indigo"
                        style={{ width: `${step.conversionRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {step.conversionRate}% of signed-in active users
                    </p>
                  </div>
                ))}
              </div>
            </AnalyticsListCard>

            <AnalyticsListCard
              title="Campaign Acquisition"
              description="First-touch UTM or referrer attribution by browser session."
              className="h-[24rem]"
            >
              {summary.topCampaigns.length === 0 ? (
                <EmptyState label="No campaign or referrer sessions captured yet." />
              ) : (
                <div className="space-y-3">
                  {summary.topCampaigns.map((campaign) => (
                    <div
                      key={`${campaign.source}-${campaign.medium}-${campaign.campaign}`}
                      className="rounded-md border border-border p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{campaign.source}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {[campaign.medium, campaign.campaign].filter(Boolean).join(' | ') ||
                              'Unlabelled source'}
                          </p>
                        </div>
                        <span className="text-sm font-semibold">{campaign.sessions}</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {campaign.visitors} visitors | {campaign.signedInUsers} signed in |{' '}
                        {campaign.courseActiveUsers} course active
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </AnalyticsListCard>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <AnalyticsListCard title="Top Pages" className="h-[24rem]" contentClassName="space-y-2">
              {summary.topPages.length === 0 ? (
                <EmptyState label="No page views yet." />
              ) : (
                summary.topPages.map((page) => (
                  <div key={page.path} className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">
                        {page.label}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {page.path}
                      </span>
                    </span>
                    <span className="font-medium">{page.views}</span>
                  </div>
                ))
              )}
            </AnalyticsListCard>

            <AnalyticsListCard
              title="Top Clicks"
              className="h-[24rem]"
              contentClassName="space-y-2"
            >
              {summary.topClicks.length === 0 ? (
                <EmptyState label="No clicks yet." />
              ) : (
                summary.topClicks.map((click) => (
                  <div key={`${click.label}-${click.path}`} className="text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 truncate font-medium">{click.label}</span>
                      <span>{click.clicks}</span>
                    </div>
                    {click.path && (
                      <p className="truncate text-xs text-muted-foreground">{click.path}</p>
                    )}
                  </div>
                ))
              )}
            </AnalyticsListCard>

            <AnalyticsListCard title="Referrers" className="h-[24rem]" contentClassName="space-y-2">
              {summary.topReferrers.length === 0 ? (
                <EmptyState label="No external referrers captured yet." />
              ) : (
                summary.topReferrers.map((referrer) => (
                  <div
                    key={referrer.source}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate text-muted-foreground">
                      {referrer.source}
                    </span>
                    <span className="font-medium">{referrer.visits}</span>
                  </div>
                ))
              )}
            </AnalyticsListCard>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <AnalyticsListCard
              title="Paid but Inactive"
              description="Eligible paid-course users with no selected-course activity in this period."
              className="h-[24rem]"
            >
              <UserRows users={summary.paidInactiveUsers} />
            </AnalyticsListCard>

            <AnalyticsListCard
              title="Low Activity"
              description="Registered users with no or low site activity in this period."
              className="h-[24rem]"
            >
              <UserRows users={summary.lowEngagementUsers} />
            </AnalyticsListCard>

            <AnalyticsListCard
              title="Ignored Users"
              description="Exclude internal or test accounts from analytics rollups."
              className="h-[24rem]"
            >
              {demo ? (
                <p className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                  Ignore-list changes are available with the live admin API.
                </p>
              ) : (
                <form
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (ignoreTarget.trim()) createIgnoredUser.mutate();
                  }}
                >
                  <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                    <Input
                      aria-label="Ignored user email or id"
                      placeholder="Email or internal user ID"
                      value={ignoreTarget}
                      onChange={(event) => setIgnoreTarget(event.target.value)}
                    />
                    <Input
                      aria-label="Ignore reason"
                      placeholder="Reason"
                      value={ignoreReason}
                      onChange={(event) => setIgnoreReason(event.target.value)}
                    />
                    <Button
                      type="submit"
                      disabled={!ignoreTarget.trim() || createIgnoredUser.isPending}
                    >
                      Add
                    </Button>
                  </div>
                </form>
              )}
              <div className="mt-4 space-y-2">
                {ignoredUsers.isLoading && (
                  <p className="text-sm text-muted-foreground">Loading ignored users...</p>
                )}
                {(ignoredUsers.data ?? []).length === 0 && !ignoredUsers.isLoading && (
                  <p className="text-sm text-muted-foreground">No ignored users yet.</p>
                )}
                {(ignoredUsers.data ?? []).map((ignored) => (
                  <div
                    key={ignored.id}
                    className="flex items-start justify-between gap-3 rounded-md border border-border p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {ignored.email ?? ignored.userId ?? ignored.clerkUserId}
                      </p>
                      {ignored.reason && (
                        <p className="mt-1 text-xs text-muted-foreground">{ignored.reason}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove ignored user"
                      disabled={deleteIgnoredUser.isPending}
                      onClick={() => deleteIgnoredUser.mutate(ignored.id)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                ))}
              </div>
            </AnalyticsListCard>
          </section>

          <AnalyticsListCard
            title="Recent Activity"
            description="Raw-event feed for sanity-checking what the tracker is capturing."
            className="h-[32rem]"
          >
            {summary.recentEvents.length === 0 ? (
              <EmptyState label="No events captured yet." />
            ) : (
              <div className="divide-y divide-border">
                {summary.recentEvents.slice(0, 12).map((event, index) => (
                  <div
                    key={`${event.occurredAt}-${index}`}
                    className="grid gap-2 py-3 text-sm md:grid-cols-[9rem_1fr_1fr_10rem]"
                  >
                    <Badge variant="secondary" className="w-fit">
                      {event.eventType}
                    </Badge>
                    <span className="min-w-0 truncate">{event.userLabel}</span>
                    <span className="min-w-0 truncate text-muted-foreground">
                      {event.resourceTitle ?? event.pagePath}
                    </span>
                    <span className="text-muted-foreground md:text-right">
                      {formatDate(event.occurredAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </AnalyticsListCard>
        </>
      )}
    </main>
  );
}
