import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  Clock,
  Download,
  Eye,
  MousePointerClick,
  RefreshCw,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { usePortalAuth } from '@/auth/auth-context';
import { getAuthMode, usesDemoAuthProvider } from '@/auth/env';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getAdminAnalytics,
  type AdminAnalyticsKpi,
  type AdminAnalyticsSummary,
  type AdminAnalyticsTrendPoint,
  type AdminAnalyticsUserMetric,
} from '@/lib/api';
import { cn } from '@/lib/utils';

const kpiIcons = [Users, UserCheck, Clock, Activity, Eye, MousePointerClick];

function demoAnalyticsSummary(rangeDays: number): AdminAnalyticsSummary {
  const kpis: AdminAnalyticsKpi[] = [
    { label: 'Active users', value: '16', detail: '12 signed-in users in demo data', tone: 'positive' },
    { label: 'Paid-course users', value: '33.3%', detail: '8 of 24 registered users', tone: 'positive' },
    { label: 'Avg session time', value: '8m 12s', detail: 'Across 15 timed sessions', tone: 'neutral' },
    { label: 'Sessions per active user', value: '2.4', detail: '38 session starts captured', tone: 'neutral' },
    { label: 'Resource views', value: '74', detail: '12 resources viewed', tone: 'neutral' },
    { label: 'Click-through actions', value: '29', detail: '9 unique click targets', tone: 'neutral' },
  ];

  return {
    rangeDays,
    generatedAt: new Date().toISOString(),
    eventCount: 128,
    userCount: 24,
    paidUserCount: 8,
    activeUserCount: 16,
    kpis,
    trend: Array.from({ length: rangeDays }, (_, index) => ({
      date: new Date(Date.now() - (rangeDays - index - 1) * 86_400_000)
        .toISOString()
        .slice(0, 10),
      activeUsers: (index % 7) + 1,
      sessions: (index % 5) + 2,
      pageViews: (index % 9) + 3,
      resourceViews: (index % 6) + 2,
      clicks: (index % 4) + 1,
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
      },
      {
        resourceId: 'demo-resource-2',
        title: 'DSA Timeline Checklist',
        courseId: 'course-1',
        type: 'pdf',
        views: 24,
        uniqueUsers: 18,
        viewsPerUser: 1.33,
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
      },
    ],
    topPages: [{ path: '/portal', views: 22, uniqueUsers: 14 }],
    topClicks: [{ label: 'Purchase Access', clicks: 8, path: '/dashboard/settings' }],
    topReferrers: [{ source: 'https://google.com', visits: 6 }],
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

function maxTrendValue(trend: AdminAnalyticsTrendPoint[]) {
  return Math.max(
    1,
    ...trend.map((point) =>
      Math.max(point.activeUsers, point.sessions, point.resourceViews, point.clicks),
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
      String(resource.views),
      `${resource.uniqueUsers} unique users`,
    ]),
    ...summary.topUsers.map((user) => [
      'user',
      user.label,
      String(user.resourceViews),
      `${user.sessions} sessions`,
    ]),
  ];
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','),
    )
    .join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `bg-analytics-${summary.rangeDays}d.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function MiniTrend({ trend }: { trend: AdminAnalyticsTrendPoint[] }) {
  const max = maxTrendValue(trend);
  const compact = trend.length > 45 ? trend.filter((_, index) => index % 3 === 0) : trend;

  return (
    <div className="h-52 rounded-md border border-border bg-white p-4">
      <div className="flex h-full items-end gap-1">
        {compact.map((point) => (
          <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex h-40 w-full items-end justify-center gap-0.5">
              <span
                className="w-1.5 rounded-t bg-brand-indigo"
                title={`${point.date}: ${point.activeUsers} active users`}
                style={{ height: `${Math.max(3, (point.activeUsers / max) * 100)}%` }}
              />
              <span
                className="w-1.5 rounded-t bg-emerald-500"
                title={`${point.date}: ${point.resourceViews} resource views`}
                style={{ height: `${Math.max(3, (point.resourceViews / max) * 100)}%` }}
              />
              <span
                className="w-1.5 rounded-t bg-amber-500"
                title={`${point.date}: ${point.clicks} clicks`}
                style={{ height: `${Math.max(3, (point.clicks / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="py-6 text-sm text-muted-foreground">{label}</p>;
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
              {user.email && <p className="break-all text-xs text-muted-foreground">{user.email}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                Last seen {formatDate(user.lastSeenAt)}
              </p>
            </div>
            {user.paidCourses.length > 0 && <Badge>Paid</Badge>}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
            <div>
              <p className="font-medium">{user.sessions}</p>
              <p className="text-muted-foreground">sessions</p>
            </div>
            <div>
              <p className="font-medium">{user.resourceViews}</p>
              <p className="text-muted-foreground">views</p>
            </div>
            <div>
              <p className="font-medium">{user.clicks}</p>
              <p className="text-muted-foreground">clicks</p>
            </div>
            <div>
              <p className="font-medium">{formatDuration(user.avgSessionTimeMs)}</p>
              <p className="text-muted-foreground">avg time</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminAnalyticsDashboard() {
  const { getToken } = usePortalAuth();
  const [rangeDays, setRangeDays] = useState(30);
  const demo = usesDemoAuthProvider(getAuthMode());
  const analytics = useQuery({
    queryKey: ['admin-analytics', rangeDays],
    queryFn: () =>
      demo
        ? Promise.resolve(demoAnalyticsSummary(rangeDays))
        : getAdminAnalytics(rangeDays, getToken),
    staleTime: 60_000,
  });

  const summary = analytics.data;
  const generatedAt = useMemo(
    () => (summary ? formatDate(summary.generatedAt) : ''),
    [summary],
  );

  return (
    <main className="mx-auto w-full max-w-[82rem] space-y-6 px-6 py-8 md:px-10 md:py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand-indigo">
            <BarChart3 className="size-4" aria-hidden />
            Analytics prototype
          </div>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">
            Learning & Growth Analytics
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Monitor course adoption, user engagement, content demand, and follow-up opportunities
            from the raw activity log.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tabs value={String(rangeDays)} onValueChange={(value) => setRangeDays(Number(value))}>
            <TabsList>
              <TabsTrigger value="7">7d</TabsTrigger>
              <TabsTrigger value="30">30d</TabsTrigger>
              <TabsTrigger value="90">90d</TabsTrigger>
            </TabsList>
          </Tabs>
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
            <Button variant="outline" size="icon" title="Download CSV" aria-label="Download CSV" onClick={() => exportCsv(summary)}>
              <Download className="size-4" />
            </Button>
          )}
        </div>
      </header>

      {analytics.isLoading && <p className="text-sm text-muted-foreground">Loading analytics...</p>}
      {analytics.isError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Unable to load analytics. Confirm the analytics migrations are applied and your account is an admin.
        </p>
      )}

      {summary && (
        <>
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {summary.kpis.map((kpi, index) => {
              const Icon = kpiIcons[index] ?? TrendingUp;
              return (
                <Card key={kpi.label} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                      <Icon className="size-4 text-brand-indigo" aria-hidden />
                    </div>
                    <p className="mt-3 text-2xl font-semibold tracking-tight">{kpi.value}</p>
                    {kpi.detail && <p className="mt-1 text-xs text-muted-foreground">{kpi.detail}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Engagement Trend</CardTitle>
                <CardDescription>
                  Active users, resource views, and clicks by day. Last generated {generatedAt}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <MiniTrend trend={summary.trend} />
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-brand-indigo" /> Active users</span>
                  <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" /> Resource views</span>
                  <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-amber-500" /> Clicks</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Follow-up Queue</CardTitle>
                <CardDescription>
                  Registered users with no or low activity in this period.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserRows users={summary.lowEngagementUsers.slice(0, 5)} />
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Most Viewed Resources</CardTitle>
                <CardDescription>
                  Content demand by unique users and repeat views.
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                              {resource.courseId ?? 'No course'} · {resource.type ?? 'resource'}
                            </p>
                          </div>
                          <p className="text-sm font-semibold">{resource.views}</p>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-brand-indigo"
                            style={{
                              width: `${Math.min(100, resource.views * 8)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {resource.uniqueUsers} unique users · {resource.viewsPerUser} views/user
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Most Engaged Users</CardTitle>
                <CardDescription>
                  Useful for identifying warm leads, motivated families, and success stories.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserRows users={summary.topUsers.slice(0, 5)} />
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {summary.topPages.length === 0 ? <EmptyState label="No page views yet." /> : summary.topPages.map((page) => (
                  <div key={page.path} className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-muted-foreground">{page.path}</span>
                    <span className="font-medium">{page.views}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Top Clicks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {summary.topClicks.length === 0 ? <EmptyState label="No clicks yet." /> : summary.topClicks.map((click) => (
                  <div key={`${click.label}-${click.path}`} className="text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 truncate font-medium">{click.label}</span>
                      <span>{click.clicks}</span>
                    </div>
                    {click.path && <p className="truncate text-xs text-muted-foreground">{click.path}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Referrers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {summary.topReferrers.length === 0 ? <EmptyState label="No external referrers captured yet." /> : summary.topReferrers.map((referrer) => (
                  <div key={referrer.source} className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-muted-foreground">{referrer.source}</span>
                    <span className="font-medium">{referrer.visits}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Raw-event feed for sanity-checking what the tracker is capturing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summary.recentEvents.length === 0 ? (
                <EmptyState label="No events captured yet." />
              ) : (
                <div className="divide-y divide-border">
                  {summary.recentEvents.slice(0, 12).map((event, index) => (
                    <div key={`${event.occurredAt}-${index}`} className="grid gap-2 py-3 text-sm md:grid-cols-[9rem_1fr_1fr_10rem]">
                      <Badge variant="secondary" className="w-fit">{event.eventType}</Badge>
                      <span className="min-w-0 truncate">{event.userLabel}</span>
                      <span className="min-w-0 truncate text-muted-foreground">
                        {event.resourceTitle ?? event.pagePath}
                      </span>
                      <span className="text-muted-foreground md:text-right">{formatDate(event.occurredAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
