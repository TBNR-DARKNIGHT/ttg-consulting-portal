import { expect, test, type Page } from '@playwright/test';

async function mockAdminApi(page: Page) {
  await page.route('http://127.0.0.1:9999/api/v1/**', async (route) => {
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
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            rangeDays: 30,
            generatedAt: '2026-07-09T12:00:00+00:00',
            eventCount: 128,
            userCount: 24,
            paidUserCount: 8,
            activeUserCount: 16,
            kpis: [
              {
                label: 'Active users',
                value: '16',
                detail: '12 signed-in users',
                tone: 'positive',
              },
              {
                label: 'Paid-course users',
                value: '33.3%',
                detail: '8 of 24 users',
                tone: 'positive',
              },
              {
                label: 'Avg session time',
                value: '8m 12s',
                detail: 'Across 15 timed sessions',
                tone: 'neutral',
              },
              {
                label: 'Sessions per active user',
                value: '2.4',
                detail: '38 session starts',
                tone: 'neutral',
              },
              {
                label: 'Resource views',
                value: '74',
                detail: '12 resources viewed',
                tone: 'neutral',
              },
              {
                label: 'Click-through actions',
                value: '29',
                detail: '9 click targets',
                tone: 'neutral',
              },
            ],
            trend: Array.from({ length: 30 }, (_, index) => ({
              date: `2026-07-${String(index + 1).padStart(2, '0')}`,
              activeUsers: (index % 7) + 1,
              sessions: (index % 5) + 2,
              pageViews: (index % 9) + 3,
              resourceViews: (index % 6) + 2,
              clicks: (index % 4) + 1,
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
              },
            ],
            topPages: [{ label: 'Portal', path: '/portal', views: 22, uniqueUsers: 14 }],
            topClicks: [{ label: 'Purchase Access', clicks: 8, path: '/dashboard/settings' }],
            topReferrers: [{ source: 'https://google.com', visits: 6 }],
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

test('renders the admin analytics dashboard prototype', async ({ page }) => {
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
  await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByRole('link', { name: 'Analytics' })).toBeVisible();
  await page.getByRole('link', { name: 'Analytics' }).click();

  await expect(page.getByRole('heading', { name: 'Learning & Growth Analytics' })).toBeVisible();
  await expect(page.getByText('Paid-course users')).toBeVisible();
  await expect(page.getByText('33.3%')).toBeVisible();
  await expect(page.getByText('Engagement Trend')).toBeVisible();
  await expect(page.getByText('Most Viewed Resources')).toBeVisible();
  await expect(page.getByText('Interview Practice').first()).toBeVisible();
  await expect(page.getByText('Follow-up Queue')).toBeVisible();
  await expect(page.locator('main')).toContainText('Quiet Parent');
  await expect(page.getByText('Recent Activity')).toBeVisible();
});
