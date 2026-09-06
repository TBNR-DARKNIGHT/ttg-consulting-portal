import { expect, test, type Page } from '@playwright/test';

async function mockAdminApi(page: Page) {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = request.url();

    if (url.endsWith('/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
            clerkUserId: 'admin_user',
            email: 'admin@example.com',
            role: 'ADMIN',
          },
          error: null,
        }),
      });
      return;
    }

    if (url.includes('/admin/analytics')) {
      const requestUrl = new URL(url);
      const periodType = requestUrl.searchParams.get('period_type') ?? 'month';
      const selectedPeriodStart = requestUrl.searchParams.get('period_start') ?? '2026-08-01';
      const periodLabel =
        periodType === 'week' ? 'W3 Aug 2026' : periodType === 'quarter' ? 'Q3 2026' : 'Aug 2026';
      const periodStart =
        periodType === 'week'
          ? '2026-08-09T16:00:00+00:00'
          : periodType === 'quarter'
            ? '2026-06-30T16:00:00+00:00'
            : '2026-07-31T16:00:00+00:00';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            periodType,
            selectedPeriodStart,
            periodLabel,
            dataAvailableFrom: '2026-01-01',
            selectedCourseId: null,
            periodStart,
            periodEnd: '2026-08-16T12:00:00+00:00',
            generatedAt: '2026-08-16T12:00:00+00:00',
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
              courseId: null,
              label: 'All courses',
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
              contentEngagementTimeMs: 4320000,
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
            kpis: [
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
                tone: 'neutral',
              },
              {
                label: 'Average progress',
                value: '54.8%',
                detail: 'Across 18 started user-resources',
                tone: 'neutral',
              },
            ],
            trend: Array.from({ length: 30 }, (_, index) => ({
              date: `2026-07-${String(index + 1).padStart(2, '0')}`,
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
                resourceId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
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
            ],
            topUsers: [
              {
                userId: 'user-1',
                label: 'Paid Parent',
                email: 'paid@example.com',
                sessions: 5,
                events: 38,
                resourceViews: 18,
                clicks: 6,
                avgSessionTimeMs: 492000,
                lastSeenAt: '2026-07-09T10:00:00+00:00',
                paidCourses: ['course-2'],
                distinctResources: 4,
                maxProgress: 100,
                completedResources: 3,
                contentEngagementMs: 1200000,
              },
            ],
            lowEngagementUsers: [
              {
                userId: 'user-2',
                label: 'Quiet Parent',
                email: 'quiet@example.com',
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
            paidInactiveUsers: [],
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
                occurredAt: '2026-07-09T10:00:00+00:00',
                userLabel: 'Paid Parent',
                pagePath: '/dashboard/resources/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
                resourceTitle: 'Interview Practice',
              },
            ],
          },
          error: null,
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], error: null }),
    });
  });
}

async function openAdminAnalytics(page: Page) {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await mockAdminApi(page);

  await page.goto('/auth/login');
  await expect(page.getByRole('button', { name: 'Continue as Free' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue as Paid' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue as Admin' }).click();
  await page.waitForURL('**/dashboard');
  const menuButton = page.getByRole('button', { name: 'Open dashboard menu' });
  const isMobile = (page.viewportSize()?.width ?? 1280) < 768;
  if (isMobile) {
    await expect(menuButton).toBeVisible();
    await menuButton.click();
  }
  await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
  await page.getByRole('link', { name: 'Settings' }).click();
  if (isMobile) {
    await expect(menuButton).toBeVisible();
    await menuButton.click();
  }
  await expect(page.getByRole('link', { name: 'Analytics' })).toBeVisible();
  await page.getByRole('link', { name: 'Analytics' }).click();

  await expect(page.getByRole('heading', { name: 'Learning & Growth Analytics' })).toBeVisible();
}

test('renders the admin course analytics dashboard', async ({ page }) => {
  await openAdminAnalytics(page);

  await expect(page.getByText('Meaningfully engaged', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('75.0%').first()).toBeVisible();
  const periodSelect = page.getByLabel('Analytics period');
  await expect(periodSelect).toBeVisible();
  await expect(periodSelect).toHaveValue('2026-08-01');
  await expect(periodSelect.locator('option').first()).toHaveText('Jan 2026');
  await expect(periodSelect.locator('option').last()).toHaveText('Aug 2026');
  await page.getByRole('tab', { name: 'Week' }).click();
  await expect(periodSelect).toHaveValue('2026-08-10');
  await expect(periodSelect.getByRole('option', { name: 'W3 Jan 2026' })).toBeAttached();
  await expect(page.getByText(/^W3 Aug 2026 \|/)).toBeVisible();
  await page.getByRole('tab', { name: 'Quarter' }).click();
  await expect(periodSelect).toHaveValue('2026-07-01');
  await expect(periodSelect.locator('option').first()).toHaveText('Q1 2026');
  await expect(periodSelect.locator('option').last()).toHaveText('Q3 2026');
  await expect(page.getByText(/^Q3 2026 \|/)).toBeVisible();
  await page.getByRole('tab', { name: 'Month' }).click();
  await expect(page.getByLabel('Filter by course')).toBeVisible();
  await expect(page.getByText('Engagement Trend')).toBeVisible();
  await expect(page.getByText('Resource Performance')).toBeVisible();
  await expect(page.getByText('Interview Practice').first()).toBeVisible();
  await expect(page.getByText('Course Engagement Funnel')).toBeVisible();
  await expect(page.getByText('Campaign Acquisition')).toBeVisible();
  await expect(page.getByText('Paid but Inactive')).toBeVisible();
  await expect(page.locator('main')).toContainText('Quiet Parent');
  await expect(page.getByText('Recent Activity')).toBeVisible();
});

test('keeps period controls usable on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openAdminAnalytics(page);

  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);

  const periodSelect = page.getByLabel('Analytics period');
  await page.getByRole('tab', { name: 'Week' }).click();
  await periodSelect.selectOption({ label: 'W3 Jan 2026' });
  await expect(periodSelect).toHaveValue('2026-01-12');
});
