export type ResourceType = 'video' | 'pdf' | 'article' | 'module';

export type ContentTopic =
  | 'dsa-pathways'
  | 'interview-preparation'
  | 'timelines-deadlines';

export type ResourceAccess = 'public' | 'paid';

export interface Resource {
  id: string;
  title: string;
  courseId?: 'course-1' | 'course-2';
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
  completed: boolean;
  completedAt?: string;
  lastAccessedAt?: string;
}
