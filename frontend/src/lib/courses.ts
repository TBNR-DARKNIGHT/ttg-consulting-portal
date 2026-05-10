import type { ContentTopic } from '@/types';

export const COURSE_IDS = ['course-1', 'course-2'] as const;
export type CourseId = (typeof COURSE_IDS)[number];

export interface CourseDefinition {
  id: CourseId;
  title: string;
  shortLabel: string;
  topics: readonly ContentTopic[];
}

export const COURSES: readonly CourseDefinition[] = [
  {
    id: 'course-1',
    title: 'DSA Pathways & Overview',
    shortLabel: 'Course 1',
    topics: ['dsa-pathways', 'timelines-deadlines'] as const,
  },
  {
    id: 'course-2',
    title: 'DSA Interview Preparation',
    shortLabel: 'Course 2',
    topics: ['interview-preparation'] as const,
  },
] as const;

const topicToCourseId = new Map<ContentTopic, CourseId>();
for (const course of COURSES) {
  for (const topic of course.topics) {
    topicToCourseId.set(topic, course.id);
  }
}

export function isCourseId(value: string): value is CourseId {
  return (COURSE_IDS as readonly string[]).includes(value);
}

export function getCourseById(id: string): CourseDefinition | undefined {
  return isCourseId(id) ? COURSES.find((c) => c.id === id) : undefined;
}

export function getCourseIdForTopic(topic: ContentTopic): CourseId {
  return topicToCourseId.get(topic) ?? 'course-1';
}
