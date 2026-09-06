import { expect, test, type Page } from '@playwright/test';

interface CapturedAnalyticsEvent {
  eventId: string;
  eventType: string;
  sessionId: string;
  anonymousId: string;
  pagePath: string;
  resourceId?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

const resourceId = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

async function interceptAnalytics(
  page: Page,
  events: CapturedAnalyticsEvent[],
  sessionEndAuthorizations: string[],
) {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    if (request.url().endsWith('/analytics/events')) {
      const body = request.postDataJSON() as { events?: CapturedAnalyticsEvent[] };
      events.push(...(body.events ?? []));
      if (body.events?.some((event) => event.eventType === 'session_end')) {
        sessionEndAuthorizations.push(request.headers().authorization ?? '');
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { accepted: body.events?.length ?? 0 }, error: null }),
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

test('captures page, resource, click, and session lifecycle events', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  const events: CapturedAnalyticsEvent[] = [];
  const sessionEndAuthorizations: string[] = [];
  await interceptAnalytics(page, events, sessionEndAuthorizations);

  await page.goto('/auth/login');
  await expect
    .poll(() => events.map((event) => event.eventType), { timeout: 10_000 })
    .toContain('session_start');
  await expect
    .poll(() => events.map((event) => event.eventType), { timeout: 10_000 })
    .toContain('page_view');
  await page.getByRole('button', { name: 'Continue as Admin' }).click();
  await page.waitForURL('**/dashboard');

  await page.evaluate(() => {
    const button = document.createElement('button');
    button.id = 'analytics-probe';
    button.dataset.analyticsId = 'probe-cta';
    button.textContent = 'Probe CTA';
    document.body.append(button);
  });
  await page.locator('#analytics-probe').click();

  await expect
    .poll(
      () =>
        events.some(
          (event) => event.eventType === 'click' && event.metadata?.analyticsId === 'probe-cta',
        ),
      { timeout: 10_000 },
    )
    .toBe(true);

  await page.goto(`/dashboard/resources/${resourceId}`);
  await expect
    .poll(
      () =>
        events.some(
          (event) => event.eventType === 'resource_view' && event.resourceId === resourceId,
        ),
      { timeout: 10_000 },
    )
    .toBe(true);

  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await expect
    .poll(() =>
      events.some(
        (event) =>
          event.eventType === 'session_end' &&
          typeof event.durationMs === 'number' &&
          event.durationMs >= 0,
      ),
    )
    .toBe(true);

  const sessionEnd = events.find((event) => event.eventType === 'session_end');
  expect(typeof sessionEnd?.metadata?.engagementDeltaMs).toBe('number');
  expect(sessionEndAuthorizations).toContain('Bearer playwright-token');

  const uniqueEventIds = new Set(events.map((event) => event.eventId));
  expect(uniqueEventIds.size).toBeGreaterThanOrEqual(6);
  expect(events.every((event) => event.sessionId)).toBe(true);
  expect(events.every((event) => event.anonymousId)).toBe(true);
});

test('keeps failed events in local storage and retries them with the next event', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  const requests: CapturedAnalyticsEvent[][] = [];
  let failAnalytics = false;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    if (request.url().endsWith('/analytics/events')) {
      const body = request.postDataJSON() as { events?: CapturedAnalyticsEvent[] };
      requests.push(body.events ?? []);
      if (failAnalytics) {
        failAnalytics = false;
        await route.abort('failed');
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { accepted: body.events?.length ?? 0 }, error: null }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], error: null }),
    });
  });

  await page.goto('/');
  await expect
    .poll(() => requests.flat().some((event) => event.eventType === 'page_view'), {
      timeout: 10_000,
    })
    .toBe(true);

  const requestsBeforeFailure = requests.length;
  failAnalytics = true;
  await page.evaluate(() => {
    const button = document.createElement('button');
    button.id = 'retry-probe';
    button.dataset.analyticsId = 'retry-probe';
    button.textContent = 'Retry Probe';
    document.body.append(button);
  });
  await page.locator('#retry-probe').click();

  await expect
    .poll(() => requests.length, {
      message: 'the first click batch should reach the failed request',
      timeout: 10_000,
    })
    .toBeGreaterThan(requestsBeforeFailure);

  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('bg_analytics_pending_events')), {
      message: 'failed click should remain queued',
      timeout: 10_000,
    })
    .not.toBe('[]');

  await page.locator('#retry-probe').click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('bg_analytics_pending_events')), {
      message: 'queued click should flush on the next successful analytics request',
      timeout: 10_000,
    })
    .toBe('[]');
});
