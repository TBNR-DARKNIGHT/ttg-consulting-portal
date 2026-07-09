import { useEffect, useRef } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { usePortalAuth } from '@/auth/auth-context';
import {
  baseAnalyticsEvent,
  captureAnalyticsEvents,
  currentPagePath,
  getSessionStartedAt,
  shouldSendSessionStart,
} from '@/lib/analytics';

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
    lastPathRef.current = path;

    const pageView = baseAnalyticsEvent('page_view');
    const events = [pageView];
    if (pageView.resourceId) {
      events.push(baseAnalyticsEvent('resource_view'));
    }
    void captureAnalyticsEvents(events, getTokenRef.current);
  }, [isLoaded, location.pathname, location.search, location.hash]);

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

    const sessionDuration = () => Math.max(0, Date.now() - getSessionStartedAt());
    const sendLifecycleEvent = (eventType: 'heartbeat' | 'session_end') => {
      void captureAnalyticsEvents(
        [baseAnalyticsEvent(eventType, { durationMs: sessionDuration() })],
        getTokenRef.current,
        { preferBeacon: eventType === 'session_end' },
      );
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendLifecycleEvent('heartbeat');
      }
    };

    const heartbeatId = window.setInterval(() => sendLifecycleEvent('heartbeat'), 60_000);

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
  }, [isLoaded]);

  return null;
}
