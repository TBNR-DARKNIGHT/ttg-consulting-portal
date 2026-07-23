import type { ContentTopic } from '@/types';

export const COURSE_IDS = ['course-1', 'course-2'] as const;
export type CourseId = (typeof COURSE_IDS)[number];
export const PUBLIC_COURSE_IDS: readonly CourseId[] = COURSE_IDS;

export const COURSE_2_MODULES = [
  { id: 'module-1', title: 'Module 1: The Research Edge' },
  { id: 'module-2', title: 'Module 2: The "Why Us" Answer' },
  { id: 'module-3', title: 'Module 3: Your Story Bank' },
  { id: 'module-4', title: 'Module 4: Closing Strong' },
] as const;

export type CourseModuleId = (typeof COURSE_2_MODULES)[number]['id'];

export function getCourse2ModuleById(id: string) {
  return COURSE_2_MODULES.find((module) => module.id === id);
}

export interface CourseDefinition {
  id: CourseId;
  title: string;
  shortLabel: string;
  topics: readonly ContentTopic[];
}

export const COURSES: readonly CourseDefinition[] = [
  {
    id: 'course-1',
    title: 'Online Seminar',
    shortLabel: 'Course',
    topics: [],
  },
  {
    id: 'course-2',
    title: 'Ace Your DSA Interview',
    shortLabel: 'Course',
    topics: [],
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
