import type { Resource, ResourceProgress, ContentTopic } from '@/types';

export const TOPIC_LABELS: Record<ContentTopic, string> = {
  'dsa-pathways': 'DSA pathways',
  'interview-preparation': 'Interview preparation',
  'timelines-deadlines': 'Timelines & deadlines',
};

/** Public sample from Mux Player docs (Big Buck Bunny) — fallback when VITE_MUX_PUBLIC_PLAYBACK_ID unset. */
const MUX_PUBLIC_DEMO_PLAYBACK_ID = 'DS00Spx1CV902MCtPj5WknGlR102V5HFkDe';

/** Course 1 topics — public Mux asset is wired here only (see backend `MUX_PUBLIC_PLAYBACK_ID`). */
const course1PublicMux =
  import.meta.env.VITE_MUX_PUBLIC_PLAYBACK_ID?.trim() || MUX_PUBLIC_DEMO_PLAYBACK_ID;

const signedMuxSeed = import.meta.env.VITE_MUX_SEED_SIGNED_PLAYBACK_ID?.trim() ?? '';

export const mockResources: Resource[] = [
  {
    id: 'res-001',
    title: 'DSA pathways overview',
    type: 'video',
    topic: 'dsa-pathways',
    access: 'public',
    description:
      'A comprehensive overview of Direct School Admission pathways, covering eligibility criteria, school options, and strategic planning for your child\u2019s application.',
    duration: '12 min',
    muxPlaybackId: course1PublicMux,
    muxPlaybackSigned: false,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'res-002',
    title: 'Interview body language tips',
    type: 'video',
    topic: 'interview-preparation',
    access: 'public',
    description:
      'Learn how to present confidently in DSA interviews with practical body language techniques that help students make a strong first impression.',
    duration: '8 min',
    // No Mux id: public asset is reserved for Course 1; this row is Course 2 topic (see backend seeds).
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'res-003',
    title: 'Portfolio building workbook',
    type: 'pdf',
    topic: 'dsa-pathways',
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
    topic: 'timelines-deadlines',
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
    topic: 'dsa-pathways',
    access: 'public',
    description:
      'How to shortlist schools based on your child\u2019s strengths, the school\u2019s talent areas, and realistic acceptance rates.',
    duration: '15 min',
    muxPlaybackId: course1PublicMux,
    muxPlaybackSigned: false,
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-20T10:00:00Z',
  },
  {
    id: 'res-007',
    title: 'Parent guide to DSA interviews',
    type: 'pdf',
    topic: 'interview-preparation',
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
    topic: 'dsa-pathways',
    access: 'public',
    description:
      'An in-depth look at the various talent areas recognised under DSA, how schools evaluate applicants, and how to position your child effectively.',
    duration: '7 min read',
    createdAt: '2026-03-10T08:00:00Z',
    updatedAt: '2026-03-10T08:00:00Z',
  },
  ...(signedMuxSeed
    ? [
        {
          id: 'res-009',
          title: 'Advanced DSA interview workshop',
          type: 'video' as const,
          topic: 'interview-preparation' as const,
          access: 'paid' as const,
          muxPlaybackId: signedMuxSeed,
          muxPlaybackSigned: true,
          description:
            'A deeper workshop on interview structure, follow-up questions, and how to reflect your child\u2019s authentic strengths under pressure.',
          duration: '42 min',
          createdAt: '2026-03-12T09:00:00Z',
          updatedAt: '2026-03-12T09:00:00Z',
        } satisfies Resource,
      ]
    : []),
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
  ...(signedMuxSeed
    ? [
        {
          resourceId: 'res-009',
          userId: 'user-001',
          completed: false,
        } satisfies ResourceProgress,
      ]
    : []),
];
