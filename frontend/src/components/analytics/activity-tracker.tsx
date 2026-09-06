import { useCallback, useEffect, useRef } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { usePortalAuth } from '@/auth/auth-context';
import {
  baseAnalyticsEvent,
  captureAnalyticsEvents,
  currentPagePath,
  extractResourceId,
  getSessionStartedAt,
  shouldSendSessionStart,
} from '@/lib/analytics';

interface PageContext {
  path: string;
  resourceId?: string;
}

function visibleText(element: Element): string | undefined {
  const text = element.textContent?.replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, 120) : undefined;
}

function clickMetadata(element: Element): Record<string, unknown> {
  const html = element as HTMLElement;
  const anchor = element instanceof HTMLAnchorElement ? element : element.closest('a');
  return {
    tag: element.tagName.toLowerCase(),
    text: visibleText(element),
    id: html.id || undefined,
    analyticsId: html.dataset.analyticsId,
    ariaLabel: html.getAttribute('aria-label') || undefined,
    role: html.getAttribute('role') || undefined,
    href: anchor instanceof HTMLAnchorElement ? anchor.href : undefined,
  };
}

export function ActivityTracker() {
  const { getToken, isLoaded } = usePortalAuth();
  const location = useRouterState({ select: (state) => state.location });
  const getTokenRef = useRef(getToken);
  const lastPathRef = useRef<string | null>(null);
  const lastPageContextRef = useRef<PageContext | null>(null);
  const visibleSinceRef = useRef<number | null>(null);
  const pendingVisibleMsRef = useRef(0);

  const collectVisibleTime = useCallback(() => {
    const now = Date.now();
    if (visibleSinceRef.current !== null) {
      pendingVisibleMsRef.current += Math.max(0, now - visibleSinceRef.current);
    }
    visibleSinceRef.current = document.visibilityState === 'visible' ? now : null;
  }, []);

  const takeVisibleTime = useCallback(() => {
    collectVisibleTime();
    const duration = Math.round(pendingVisibleMsRef.current);
    pendingVisibleMsRef.current = 0;
    return duration;
  }, [collectVisibleTime]);

  const lifecycleEvent = useCallback(
    (eventType: 'heartbeat' | 'session_end', context: PageContext, engagementDeltaMs: number) =>
      baseAnalyticsEvent(eventType, {
        pagePath: context.path,
        resourceId: context.resourceId,
        durationMs: Math.max(0, Date.now() - getSessionStartedAt()),
        metadata: { engagementDeltaMs },
      }),
    [],
  );

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;

    if (shouldSendSessionStart()) {
      void captureAnalyticsEvents([baseAnalyticsEvent('session_start')], getTokenRef.current);
    }
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    const path = currentPagePath();
    if (lastPathRef.current === path) return;

    const previousContext = lastPageContextRef.current;
    if (previousContext) {
      const engagementDeltaMs = takeVisibleTime();
      if (engagementDeltaMs > 0) {
        void captureAnalyticsEvents(
          [lifecycleEvent('heartbeat', previousContext, engagementDeltaMs)],
          getTokenRef.current,
        );
      }
    }

    lastPathRef.current = path;
    lastPageContextRef.current = {
      path,
      resourceId: extractResourceId(window.location.pathname),
    };

    const pageView = baseAnalyticsEvent('page_view');
    const events = [pageView];
    if (pageView.resourceId) {
      events.push(baseAnalyticsEvent('resource_view'));
    }
    void captureAnalyticsEvents(events, getTokenRef.current);
  }, [
    isLoaded,
    lifecycleEvent,
    location.hash,
    location.pathname,
    location.search,
    takeVisibleTime,
  ]);

  useEffect(() => {
    if (!isLoaded) return;

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const trackable = target?.closest('a,button,[role="button"],[data-analytics-id]');
      if (!trackable) return;

      void captureAnalyticsEvents(
        [baseAnalyticsEvent('click', { metadata: clickMetadata(trackable) })],
        getTokenRef.current,
      );
    };

    const sendLifecycleEvent = (eventType: 'heartbeat' | 'session_end') => {
      const context = lastPageContextRef.current ?? {
        path: currentPagePath(),
        resourceId: extractResourceId(window.location.pathname),
      };
      void captureAnalyticsEvents(
        [lifecycleEvent(eventType, context, takeVisibleTime())],
        getTokenRef.current,
        { preferBeacon: eventType === 'session_end' },
      );
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendLifecycleEvent('heartbeat');
      } else {
        collectVisibleTime();
      }
    };

    visibleSinceRef.current = document.visibilityState === 'visible' ? Date.now() : null;
    const heartbeatId = window.setInterval(() => {
      if (document.visibilityState === 'visible') sendLifecycleEvent('heartbeat');
    }, 60_000);

    document.addEventListener('click', onClick, { capture: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    const onPageHide = () => sendLifecycleEvent('session_end');

    window.addEventListener('pagehide', onPageHide);

    return () => {
      document.removeEventListener('click', onClick, { capture: true });
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      window.clearInterval(heartbeatId);
    };
  }, [collectVisibleTime, isLoaded, lifecycleEvent, takeVisibleTime]);

  return null;
}
