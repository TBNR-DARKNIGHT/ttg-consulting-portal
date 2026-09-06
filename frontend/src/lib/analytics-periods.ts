import type { AdminAnalyticsPeriodType } from '@/lib/api';

const dayMs = 86_400_000;
const monthLabels = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function dateFromKey(value: string): Date {
  const [year = 1970, month = 1, day = 1] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function dateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * dayMs);
}

export function singaporeTodayKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return year && month && day ? `${year}-${month}-${day}` : now.toISOString().slice(0, 10);
}

export function analyticsPeriodStart(
  periodType: AdminAnalyticsPeriodType,
  containingDate: string,
): string {
  const date = dateFromKey(containingDate);
  if (periodType === 'week') {
    const daysSinceMonday = (date.getUTCDay() + 6) % 7;
    return dateKey(addDays(date, -daysSinceMonday));
  }
  date.setUTCDate(1);
  if (periodType === 'quarter') {
    date.setUTCMonth(Math.floor(date.getUTCMonth() / 3) * 3);
  }
  return dateKey(date);
}

export function nextAnalyticsPeriodStart(
  periodType: AdminAnalyticsPeriodType,
  periodStart: string,
): string {
  const date = dateFromKey(periodStart);
  if (periodType === 'week') return dateKey(addDays(date, 7));
  date.setUTCMonth(date.getUTCMonth() + (periodType === 'quarter' ? 3 : 1));
  return dateKey(date);
}

export function analyticsPeriodLabel(
  periodType: AdminAnalyticsPeriodType,
  periodStart: string,
): string {
  const date = dateFromKey(periodStart);
  if (periodType === 'month') {
    return `${monthLabels[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  }
  if (periodType === 'quarter') {
    return `Q${Math.floor(date.getUTCMonth() / 3) + 1} ${date.getUTCFullYear()}`;
  }

  const labelDate = addDays(date, 3);
  const monthStart = new Date(Date.UTC(labelDate.getUTCFullYear(), labelDate.getUTCMonth(), 1));
  const firstWeekStart = addDays(monthStart, -((monthStart.getUTCDay() + 6) % 7));
  const weekNumber = Math.floor((date.getTime() - firstWeekStart.getTime()) / (7 * dayMs)) + 1;
  return `W${weekNumber} ${monthLabels[labelDate.getUTCMonth()]} ${labelDate.getUTCFullYear()}`;
}

export function analyticsPeriodOptions(
  periodType: AdminAnalyticsPeriodType,
  dataAvailableFrom: string | null,
): Array<{ value: string; label: string }> {
  const today = singaporeTodayKey();
  const currentStart = analyticsPeriodStart(periodType, today);
  const fallbackStart = `${today.slice(0, 4)}-01-01`;
  const earliestStart = analyticsPeriodStart(periodType, dataAvailableFrom ?? fallbackStart);
  const options: Array<{ value: string; label: string }> = [];
  let cursor = earliestStart > currentStart ? currentStart : earliestStart;

  for (let count = 0; cursor <= currentStart && count < 1000; count += 1) {
    options.push({ value: cursor, label: analyticsPeriodLabel(periodType, cursor) });
    cursor = nextAnalyticsPeriodStart(periodType, cursor);
  }
  return options;
}

export function analyticsPeriodDayKeys(
  periodType: AdminAnalyticsPeriodType,
  periodStart: string,
): string[] {
  const today = singaporeTodayKey();
  const end = nextAnalyticsPeriodStart(periodType, periodStart);
  const days: string[] = [];
  let cursor = periodStart;
  while (cursor < end && cursor <= today) {
    days.push(cursor);
    cursor = dateKey(addDays(dateFromKey(cursor), 1));
  }
  return days.length > 0 ? days : [periodStart];
}
