import type { Resource, ResourceProgress, ContentTopic } from '@/types';

export const TOPIC_LABELS: Partial<Record<ContentTopic, string>> = {
  'DSA Pathways': 'DSA Pathways',
  'Interview Preparation': 'Interview Preparation',
  'Timelines & Deadlines': 'Timelines & Deadlines',
};

/** Mirrors backend seed catalog; video muxPlaybackId is set after Mux sync in live mode. */
export const mockResources: Resource[] = [
  {
    id: 'res-001',
    title: 'DSA pathways overview',
    type: 'video',
    topic: 'DSA Pathways',
    access: 'public',
    description:
      'A comprehensive overview of Direct School Admission pathways, covering eligibility criteria, school options, and strategic planning for your child\u2019s application.',
    duration: '12 min',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'res-002',
    title: 'Interview body language tips',
    courseId: 'course-2',
    moduleId: 'module-1',
    type: 'video',
    topic: 'Interview Preparation',
    access: 'public',
    description:
      'Learn how to present confidently in DSA interviews with practical body language techniques that help students make a strong first impression.',
    duration: '8 min',
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'res-003',
    title: 'Portfolio building workbook',
    type: 'pdf',
    topic: 'DSA Pathways',
    access: 'public',
    bucket: 'resources-public',
    filePath: 'course-1/pdf/testpublic.pdf',
    description:
      'A step-by-step workbook to help parents and students compile a compelling portfolio showcasing achievements, talents, and extracurricular involvement.',
    duration: '24 pages',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-01T09:00:00Z',
  },
  {
    id: 'res-004',
    title: 'Timeline & key deadlines 2026',
    type: 'article',
    topic: 'Timelines & Deadlines',
    access: 'public',
    description:
      'A complete calendar of DSA application windows, school-specific deadlines, and important dates for the 2026 admissions cycle.',
    duration: '5 min read',
    createdAt: '2026-02-10T11:00:00Z',
    updatedAt: '2026-03-01T14:00:00Z',
  },
  {
    id: 'res-006',
    title: 'School selection strategy',
    type: 'video',
    topic: 'DSA Pathways',
    access: 'public',
    description:
      'How to shortlist schools based on your child\u2019s strengths, the school\u2019s talent areas, and realistic acceptance rates.',
    duration: '15 min',
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-20T10:00:00Z',
  },
  {
    id: 'res-007',
    title: 'Parent guide to DSA interviews',
    courseId: 'course-2',
    moduleId: 'module-2',
    type: 'pdf',
    topic: 'Interview Preparation',
    access: 'paid',
    bucket: 'resources-paid',
    filePath: 'course-2/pdf/testpaid.pdf',
    description:
      'Everything parents need to know about supporting their child through the DSA interview process, from preparation to day-of logistics.',
    duration: '32 pages',
    createdAt: '2026-03-01T09:00:00Z',
    updatedAt: '2026-03-01T09:00:00Z',
  },
  {
    id: 'res-008',
    title: 'Understanding talent areas',
    type: 'article',
    topic: 'DSA Pathways',
    access: 'public',
    description:
      'An in-depth look at the various talent areas recognised under DSA, how schools evaluate applicants, and how to position your child effectively.',
    duration: '7 min read',
    createdAt: '2026-03-10T08:00:00Z',
    updatedAt: '2026-03-10T08:00:00Z',
  },
  {
    id: 'res-009',
    title: 'Advanced DSA interview workshop',
    courseId: 'course-2',
    moduleId: 'module-4',
    type: 'video',
    topic: 'Interview Preparation',
    access: 'paid',
    description:
      'A deeper workshop on interview structure, follow-up questions, and how to reflect your child\u2019s authentic strengths under pressure.',
    duration: '42 min',
    createdAt: '2026-03-12T09:00:00Z',
    updatedAt: '2026-03-12T09:00:00Z',
  },
];

export const mockProgress: ResourceProgress[] = [
  {
    resourceId: 'res-001',
    userId: 'user-001',
    completed: true,
    completedAt: '2026-02-01T14:30:00Z',
    lastAccessedAt: '2026-02-01T14:30:00Z',
  },
  {
    resourceId: 'res-002',
    userId: 'user-001',
    completed: true,
    completedAt: '2026-02-05T09:15:00Z',
    lastAccessedAt: '2026-02-05T09:15:00Z',
  },
  {
    resourceId: 'res-003',
    userId: 'user-001',
    completed: false,
    lastAccessedAt: '2026-02-12T16:00:00Z',
  },
  {
    resourceId: 'res-004',
    userId: 'user-001',
    completed: false,
    lastAccessedAt: '2026-03-05T10:00:00Z',
  },
  {
    resourceId: 'res-006',
    userId: 'user-001',
    completed: false,
  },
  {
    resourceId: 'res-007',
    userId: 'user-001',
    completed: false,
  },
  {
    resourceId: 'res-008',
    userId: 'user-001',
    completed: false,
  },
  {
    resourceId: 'res-009',
    userId: 'user-001',
    completed: false,
  },
];
