export type ResourceType = 'video' | 'pdf' | 'article' | 'module';

export type ContentTopic = string;

export type ResourceAccess = 'public' | 'paid';

export interface Resource {
  id: string;
  title: string;
  courseId?: 'course-1' | 'course-2';
  moduleId?: string;
  type: ResourceType;
  topic: ContentTopic;
  description: string;
  duration: string;
  access?: ResourceAccess;
  bucket?: string;
  filePath?: string;
  thumbnailUrl?: string;
  contentUrl?: string;
  /** Mux Video playback ID (public or signed policy per `muxPlaybackSigned`). */
  muxPlaybackId?: string;
  /** When true, the browser must fetch a short-lived JWT from `/playback/mux-token`. */
  muxPlaybackSigned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceProgress {
  resourceId: string;
  userId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completed: boolean;
  progressPercent: number;
  completedAt?: string;
  lastAccessedAt?: string;
  lastPositionSeconds?: number;
  durationSeconds?: number;
  pagesViewed?: number[];
  pageCount?: number;
  completionSource?: 'manual' | 'video_threshold' | 'video_ended';
}
