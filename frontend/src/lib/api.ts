export { apiFetch, apiFetchBlob, apiFetchPublic, getApiUrl, hasApiBaseUrl } from '@/lib/api-client';

import { apiFetch, apiFetchPublic } from '@/lib/api-client';

export interface StorageUrlResponse {
  bucket: string;
  path: string;
  is_paid: boolean;
  url: string;
  expires_in: number | null;
}

/** Same shape as Supabase `getPublicUrl` — avoids a round-trip when `VITE_SUPABASE_URL` is set. */
/** Resolve a public PDF through the backend catalog allowlist. */
export function getPublicStorageUrl(
  params: { resourceId: string },
  getToken: () => Promise<string | null>,
): Promise<StorageUrlResponse> {
  return apiFetch<StorageUrlResponse>(
    `/storage/public-url?resource_id=${encodeURIComponent(params.resourceId)}`,
    getToken,
  );
}

export function getPaidStorageUrl(
  params: { resourceId: string; expiresIn?: number },
  getToken: () => Promise<string | null>,
): Promise<StorageUrlResponse> {
  const query = new URLSearchParams({
    resource_id: params.resourceId,
    expires_in: String(params.expiresIn ?? 3600),
  });
  return apiFetch<StorageUrlResponse>(`/storage/paid-url?${query}`, getToken);
}

export function getPdfThumbnailUrl(
  resourceId: string,
  getToken: () => Promise<string | null>,
): Promise<StorageUrlResponse> {
  return apiFetch<StorageUrlResponse>(
    `/storage/thumbnail-url?resource_id=${encodeURIComponent(resourceId)}`,
    getToken,
  );
}

export interface MuxPlaybackTokenResponse {
  token: string;
  expiresAt: number;
}

export interface EntitlementsResponse {
  courses: string[];
}

export interface RedemptionResponse {
  courseId: string;
  status: 'granted';
}

export interface CurrentUserResponse {
  id: string;
  clerkUserId: string;
  email: string | null;
  role: 'ADMIN' | 'CONSULTANT' | 'CLIENT';
}

export interface AdminAccessCode {
  id: string;
  courseId: string;
  orderId: string | null;
  redeemedByUserId: string | null;
  redeemedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  createdByUserId: string | null;
  revokedAt: string | null;
  revokedByUserId: string | null;
  revocationReason: string | null;
  replacementForCodeId: string | null;
}

export interface IssuedAccessCode {
  id: string;
  code: string;
}

export interface TtaCodeBatch {
  quantity: number;
  sheetTab: string;
}

export interface AdminAnalyticsKpi {
  label: string;
  value: string;
  detail: string | null;
  tone: string;
}

export interface AdminAnalyticsTrendPoint {
  date: string;
  activeUsers: number;
  sessions: number;
  pageViews: number;
  resourceViews: number;
  clicks: number;
}

export interface AdminAnalyticsResourceMetric {
  resourceId: string | null;
  title: string;
  courseId: string | null;
  type: string | null;
  views: number;
  uniqueUsers: number;
  viewsPerUser: number;
}

export interface AdminAnalyticsUserMetric {
  userId: string;
  label: string;
  email: string | null;
  sessions: number;
  events: number;
  resourceViews: number;
  clicks: number;
  avgSessionTimeMs: number;
  lastSeenAt: string | null;
  paidCourses: string[];
}

export interface AdminAnalyticsPageMetric {
  label: string;
  path: string;
  views: number;
  uniqueUsers: number;
}

export interface AdminAnalyticsClickMetric {
  label: string;
  clicks: number;
  path: string | null;
}

export interface AdminAnalyticsReferrerMetric {
  source: string;
  visits: number;
}

export interface AdminAnalyticsEventMetric {
  eventType: string;
  occurredAt: string;
  userLabel: string;
  pagePath: string;
  resourceTitle: string | null;
}

export interface AdminAnalyticsSummary {
  rangeDays: number;
  generatedAt: string;
  eventCount: number;
  userCount: number;
  paidUserCount: number;
  activeUserCount: number;
  kpis: AdminAnalyticsKpi[];
  trend: AdminAnalyticsTrendPoint[];
  topResources: AdminAnalyticsResourceMetric[];
  topUsers: AdminAnalyticsUserMetric[];
  lowEngagementUsers: AdminAnalyticsUserMetric[];
  topPages: AdminAnalyticsPageMetric[];
  topClicks: AdminAnalyticsClickMetric[];
  topReferrers: AdminAnalyticsReferrerMetric[];
  recentEvents: AdminAnalyticsEventMetric[];
}

export interface AdminAnalyticsIgnoredUser {
  id: string;
  userId: string | null;
  clerkUserId: string | null;
  email: string | null;
  reason: string;
  createdAt: string;
}

export function getCurrentUser(
  getToken: () => Promise<string | null>,
): Promise<CurrentUserResponse> {
  return apiFetch<CurrentUserResponse>('/me', getToken);
}

export function getAdminAccessCodes(
  getToken: () => Promise<string | null>,
): Promise<AdminAccessCode[]> {
  return apiFetch<AdminAccessCode[]>('/admin/access-codes', getToken);
}

export function getAdminAnalytics(
  rangeDays: number,
  getToken: () => Promise<string | null>,
): Promise<AdminAnalyticsSummary> {
  return apiFetch<AdminAnalyticsSummary>(
    `/admin/analytics?range_days=${encodeURIComponent(String(rangeDays))}`,
    getToken,
  );
}

export function getAdminAnalyticsIgnoredUsers(
  getToken: () => Promise<string | null>,
): Promise<AdminAnalyticsIgnoredUser[]> {
  return apiFetch<AdminAnalyticsIgnoredUser[]>('/admin/analytics/ignored-users', getToken);
}

export function createAdminAnalyticsIgnoredUser(
  input: {
    userId?: string;
    clerkUserId?: string;
    email?: string;
    reason?: string;
  },
  getToken: () => Promise<string | null>,
): Promise<AdminAnalyticsIgnoredUser> {
  return apiFetch<AdminAnalyticsIgnoredUser>('/admin/analytics/ignored-users', getToken, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteAdminAnalyticsIgnoredUser(
  ignoredUserId: string,
  getToken: () => Promise<string | null>,
): Promise<null> {
  return apiFetch<null>(
    `/admin/analytics/ignored-users/${encodeURIComponent(ignoredUserId)}`,
    getToken,
    { method: 'DELETE' },
  );
}

export function createAdminAccessCode(
  input: { courseId: string; orderId?: string; expiresAt?: string },
  getToken: () => Promise<string | null>,
): Promise<IssuedAccessCode> {
  return apiFetch<IssuedAccessCode>('/admin/access-codes', getToken, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createTtaCodeBatch(
  quantity: number,
  getToken: () => Promise<string | null>,
): Promise<TtaCodeBatch> {
  return apiFetch<TtaCodeBatch>('/admin/access-codes/tta-batch', getToken, {
    method: 'POST',
    body: JSON.stringify({ quantity }),
  });
}

export function revokeAdminAccessCode(
  id: string,
  reason: string,
  getToken: () => Promise<string | null>,
): Promise<null> {
  return apiFetch<null>(`/admin/access-codes/${encodeURIComponent(id)}/revoke`, getToken, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function revokeAllActiveAdminAccessCodes(
  reason: string,
  getToken: () => Promise<string | null>,
): Promise<{ revokedCount: number }> {
  return apiFetch<{ revokedCount: number }>('/admin/access-codes/revoke-all-active', getToken, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function deleteRevokedAdminAccessCodes(
  reason: string,
  getToken: () => Promise<string | null>,
): Promise<{ deletedCount: number }> {
  return apiFetch<{ deletedCount: number }>('/admin/access-codes/delete-revoked', getToken, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function resetTtaOrderNumbering(
  reason: string,
  getToken: () => Promise<string | null>,
): Promise<{ nextOrderId: string }> {
  return apiFetch<{ nextOrderId: string }>('/admin/access-codes/reset-tta-numbering', getToken, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function reissueAdminAccessCode(
  id: string,
  reason: string,
  getToken: () => Promise<string | null>,
): Promise<IssuedAccessCode> {
  return apiFetch<IssuedAccessCode>(
    `/admin/access-codes/${encodeURIComponent(id)}/reissue`,
    getToken,
    { method: 'POST', body: JSON.stringify({ reason }) },
  );
}

export interface AdminResourceUpload {
  resourceId: string;
  type: 'pdf' | 'video';
  status: string;
  uploadUrl?: string;
  uploadId?: string;
}

interface AdminDocumentUploadTarget {
  type: 'pdf';
  status: string;
  uploadUrl: string;
  uploadId: string;
}

export interface AdminResourceMetadata {
  title: string;
  description: string;
  courseId: string;
  moduleId?: string;
  moduleTitle?: string;
  topic: string;
}

export interface AdminResourceUploadOptions {
  courses: string[];
  topicsByCourse: Record<string, string[]>;
  modulesByCourse: Record<string, Array<{ id: string; title: string }>>;
}

export function getAdminResourceUploadOptions(
  getToken: () => Promise<string | null>,
): Promise<AdminResourceUploadOptions> {
  return apiFetch<AdminResourceUploadOptions>('/admin/resources/options', getToken);
}

export function updateAdminResource(
  resourceId: string,
  input: { title: string; topic: string; description: string },
  getToken: () => Promise<string | null>,
): Promise<null> {
  return apiFetch<null>(`/admin/resources/${encodeURIComponent(resourceId)}`, getToken, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteAdminResource(
  resourceId: string,
  getToken: () => Promise<string | null>,
): Promise<null> {
  return apiFetch<null>(`/admin/resources/${encodeURIComponent(resourceId)}`, getToken, {
    method: 'DELETE',
  });
}

export async function replaceAdminDocument(
  resourceId: string,
  file: File,
  getToken: () => Promise<string | null>,
  onProgress: (percent: number) => void,
): Promise<null> {
  const target = await apiFetch<AdminDocumentUploadTarget>(
    `/admin/resources/${encodeURIComponent(resourceId)}/document-replacement`,
    getToken,
    {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'application/pdf',
        fileSize: file.size,
      }),
    },
  );
  await putSupabaseFileWithProgress(target.uploadUrl, file, onProgress);
  return apiFetch<null>(
    `/admin/resources/${encodeURIComponent(resourceId)}/document-replacement/complete`,
    getToken,
    { method: 'POST' },
  );
}

export async function uploadAdminDocument(
  file: File,
  metadata: AdminResourceMetadata,
  getToken: () => Promise<string | null>,
  onProgress: (percent: number) => void,
): Promise<AdminResourceUpload> {
  const target = await apiFetch<AdminDocumentUploadTarget>('/admin/resources/documents', getToken, {
    method: 'POST',
    body: JSON.stringify({
      ...metadata,
      filename: file.name,
      contentType: file.type || 'application/pdf',
      fileSize: file.size,
    }),
  });
  await putSupabaseFileWithProgress(target.uploadUrl, file, onProgress);
  return apiFetch<AdminResourceUpload>('/admin/resources/documents/complete', getToken, {
    method: 'POST',
    body: JSON.stringify({ ...metadata, uploadId: target.uploadId }),
  });
}

function putSupabaseFileWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  const form = new FormData();
  form.set('cacheControl', '3600');
  form.set('file', file);

  return putRequestWithProgress({
    url,
    body: form,
    onProgress,
    failureLabel: 'PDF upload',
    interruptionMessage: 'The connection to document storage was interrupted',
  });
}

export function createAdminVideoUpload(
  file: File,
  metadata: AdminResourceMetadata,
  getToken: () => Promise<string | null>,
): Promise<AdminResourceUpload> {
  return apiFetch<AdminResourceUpload>('/admin/resources/videos', getToken, {
    method: 'POST',
    body: JSON.stringify({
      ...metadata,
      contentType: file.type || 'video/mp4',
    }),
  });
}

export function createAdminLinkUpload(
  url: string,
  resourceType: 'pdf' | 'video',
  metadata: AdminResourceMetadata,
  getToken: () => Promise<string | null>,
): Promise<AdminResourceUpload> {
  return apiFetch<AdminResourceUpload>('/admin/resources/links', getToken, {
    method: 'POST',
    body: JSON.stringify({ ...metadata, url, resourceType }),
  });
}

export function putFileWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return putRequestWithProgress({
    url,
    body: file,
    contentType: file.type || 'video/mp4',
    onProgress,
    failureLabel: 'Mux upload',
    interruptionMessage: 'The connection to Mux was interrupted',
  });
}

function putRequestWithProgress({
  url,
  body,
  contentType,
  onProgress,
  failureLabel,
  interruptionMessage,
}: {
  url: string;
  body: XMLHttpRequestBodyInit;
  contentType?: string;
  onProgress: (percent: number) => void;
  failureLabel: string;
  interruptionMessage: string;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', url);
    if (contentType) {
      request.setRequestHeader('Content-Type', contentType);
    }
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error(`${failureLabel} failed (${request.status})`));
    };
    request.onerror = () => reject(new Error(interruptionMessage));
    request.send(body);
  });
}

export function completeAdminVideoUpload(
  resourceId: string,
  uploadId: string,
  getToken: () => Promise<string | null>,
): Promise<AdminResourceUpload> {
  const query = new URLSearchParams({ upload_id: uploadId });
  return apiFetch<AdminResourceUpload>(
    `/admin/resources/videos/${encodeURIComponent(resourceId)}/complete?${query}`,
    getToken,
    { method: 'POST' },
  );
}

export function getEntitlements(
  getToken: () => Promise<string | null>,
): Promise<EntitlementsResponse> {
  return apiFetch<EntitlementsResponse>('/me/entitlements', getToken);
}

export function redeemAccessCode(
  code: string,
  getToken: () => Promise<string | null>,
): Promise<RedemptionResponse> {
  return apiFetch<RedemptionResponse>('/entitlements/redeem', getToken, {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export function getMuxPlaybackToken(
  params: { resourceId: string; expiresIn?: number },
  getToken: () => Promise<string | null>,
): Promise<MuxPlaybackTokenResponse> {
  const q = new URLSearchParams({ resource_id: params.resourceId });
  if (params.expiresIn != null) {
    q.set('expires_in', String(params.expiresIn));
  }
  return apiFetch<MuxPlaybackTokenResponse>(`/playback/mux-token?${q.toString()}`, getToken);
}

export function getMuxThumbnailToken(
  resourceId: string,
  getToken: () => Promise<string | null>,
): Promise<MuxPlaybackTokenResponse> {
  return apiFetch<MuxPlaybackTokenResponse>(
    `/playback/mux-thumbnail-token?resource_id=${encodeURIComponent(resourceId)}`,
    getToken,
  );
}

export interface PortalPreview {
  id: string;
  title: string;
  muxPlaybackId: string;
  duration: string;
}

export function getPortalCoursePreviews(): Promise<PortalPreview[]> {
  return apiFetchPublic<PortalPreview[]>('/portal/course-previews');
}
