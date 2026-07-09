import { getApiUrl, hasApiBaseUrl } from '@/lib/api';

export type AnalyticsEventType =
  | 'page_view'
  | 'click'
  | 'session_start'
  | 'session_end'
  | 'heartbeat'
  | 'resource_view';

export interface AnalyticsEvent {
  eventId: string;
  eventType: AnalyticsEventType;
  sessionId: string;
  anonymousId: string;
  occurredAt: string;
  pagePath: string;
  pageTitle?: string;
  resourceId?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  referrer?: string;
}

const anonymousIdKey = 'bg_analytics_anonymous_id';
const sessionIdKey = 'bg_analytics_session_id';
const sessionStartKey = 'bg_analytics_session_started_at';
const sessionStartedKey = 'bg_analytics_session_start_sent';
const pendingEventsKey = 'bg_analytics_pending_events';
const maxPendingEvents = 100;
const memoryStorage = new Map<string, string>();
let flushInProgress = false;

function createId(): string {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
    .slice(6, 8)
    .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}

function storedId(storage: Storage, key: string): string {
  const existing = readStorage(storage, key);
  if (existing) return existing;
  const next = createId();
  writeStorage(storage, key, next);
  return next;
}

function readStorage(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key) ?? memoryStorage.get(key) ?? null;
  } catch {
    return memoryStorage.get(key) ?? null;
  }
}

function writeStorage(storage: Storage, key: string, value: string): void {
  memoryStorage.set(key, value);
  try {
    storage.setItem(key, value);
  } catch {
    // In-memory fallback is enough for browsers that block storage.
  }
}

export function getAnonymousId(): string {
  return storedId(window.localStorage, anonymousIdKey);
}

export function getSessionId(): string {
  return storedId(window.sessionStorage, sessionIdKey);
}

export function getSessionStartedAt(): number {
  const existing = readStorage(window.sessionStorage, sessionStartKey);
  if (existing) return Number(existing);
  const startedAt = Date.now();
  writeStorage(window.sessionStorage, sessionStartKey, String(startedAt));
  return startedAt;
}

export function shouldSendSessionStart(): boolean {
  if (readStorage(window.sessionStorage, sessionStartedKey)) return false;
  writeStorage(window.sessionStorage, sessionStartedKey, 'true');
  return true;
}

export function currentPagePath(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function extractResourceId(pathname: string): string | undefined {
  const match = pathname.match(/\/dashboard\/resources\/([^/?#]+)/);
  const candidate = match?.[1] ? decodeURIComponent(match[1]) : '';
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    candidate,
  )
    ? candidate
    : undefined;
}

export async function captureAnalyticsEvents(
  events: AnalyticsEvent[],
  getToken: () => Promise<string | null>,
  options: { preferBeacon?: boolean } = {},
): Promise<void> {
  if (!hasApiBaseUrl() || events.length === 0) return;

  queueAnalyticsEvents(events);
  await flushAnalyticsEvents(getToken, options);
}

function readPendingEvents(): AnalyticsEvent[] {
  const raw = readStorage(window.localStorage, pendingEventsKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

function writePendingEvents(events: AnalyticsEvent[]): void {
  writeStorage(
    window.localStorage,
    pendingEventsKey,
    JSON.stringify(events.slice(-maxPendingEvents)),
  );
}

function queueAnalyticsEvents(events: AnalyticsEvent[]): void {
  const pending = readPendingEvents();
  const byId = new Map(pending.map((event) => [event.eventId, event]));
  for (const event of events) {
    byId.set(event.eventId, event);
  }
  writePendingEvents([...byId.values()]);
}

async function flushAnalyticsEvents(
  getToken: () => Promise<string | null>,
  options: { preferBeacon?: boolean },
): Promise<void> {
  if (flushInProgress) return;
  const pending = readPendingEvents();
  if (pending.length === 0) return;

  const batch = pending.slice(0, 25);
  const body = JSON.stringify({ events: batch });
  if (options.preferBeacon && navigator.sendBeacon) {
    const queued = navigator.sendBeacon(
      getApiUrl('/analytics/events'),
      new Blob([body], { type: 'application/json' }),
    );
    if (queued) {
      removePendingEvents(batch);
      return;
    }
  }

  flushInProgress = true;
  let sentSuccessfully = false;
  try {
    const token = await getToken();
    const response = await fetch(getApiUrl('/analytics/events'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
      keepalive: true,
    });
    if (response.ok) {
      removePendingEvents(batch);
      sentSuccessfully = true;
    }
  } catch {
    // Analytics must never interrupt the user experience.
  } finally {
    flushInProgress = false;
    if (sentSuccessfully && readPendingEvents().length > 0) {
      void flushAnalyticsEvents(getToken, {});
    }
  }
}

function removePendingEvents(sent: AnalyticsEvent[]): void {
  const sentIds = new Set(sent.map((event) => event.eventId));
  writePendingEvents(readPendingEvents().filter((event) => !sentIds.has(event.eventId)));
}

export function baseAnalyticsEvent(
  eventType: AnalyticsEventType,
  overrides: Partial<AnalyticsEvent> = {},
): AnalyticsEvent {
  const resourceId = extractResourceId(window.location.pathname);
  return {
    eventId: createId(),
    eventType,
    sessionId: getSessionId(),
    anonymousId: getAnonymousId(),
    occurredAt: new Date().toISOString(),
    pagePath: currentPagePath(),
    pageTitle: document.title,
    referrer: document.referrer || undefined,
    ...(resourceId ? { resourceId } : {}),
    ...overrides,
  };
}
