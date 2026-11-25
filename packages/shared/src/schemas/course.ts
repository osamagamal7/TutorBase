import { z } from 'zod';

import { IdSchema, PublishStatusSchema, TimestampSchema } from './common';

export const SubjectSchema = z.enum([
  'Languages',
  'Mathematics',
  'Science',
  'Programming',
  'Music',
  'Exam preparation',
  'Other',
]);

export const LevelSchema = z.enum(['Beginner', 'Intermediate', 'Advanced']);

export const MaterialTypeSchema = z.enum(['pdf', 'markdown']);

export const IngestStatusSchema = z.enum([
  'pending',
  'processing',
  'ready',
  'failed',
]);

const MAX_MATERIAL_BYTES = 10 * 1024 * 1024;

export const CourseSchema = z
  .object({
    id: IdSchema,
    tutor_id: IdSchema,
    title: z.string().min(5).max(100),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().max(5_000),
    subject: SubjectSchema,
    level: LevelSchema,
    language: z.string().min(2),
    status: PublishStatusSchema,
    published_at: TimestampSchema.nullable(),
  })
  .superRefine((course, ctx) => {
    if (course.status === 'published' && course.published_at === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['published_at'],
        message: 'A published course has a published_at time',
      });
    }
  });

export type Course = z.infer<typeof CourseSchema>;

export const CourseListItemSchema = z.object({
  id: IdSchema,
  slug: CourseSchema.shape.slug,
  title: CourseSchema.shape.title,
  subject: SubjectSchema,
  level: LevelSchema,
  tutor_name: z.string().min(2),
  material_count: z.int().min(0),
});

export type CourseListItem = z.infer<typeof CourseListItemSchema>;

export const MaterialSchema = z.object({
  id: IdSchema,
  course_id: IdSchema,
  title: z.string().min(1),
  type: MaterialTypeSchema,
  storage_key: z.string().min(1),
  size_bytes: z.int().min(0).max(MAX_MATERIAL_BYTES),
  position: z.int().min(0),
  ingest_status: IngestStatusSchema,
});

export type Material = z.infer<typeof MaterialSchema>;

export const EnrollmentSchema = z.object({
  id: IdSchema,
  course_id: IdSchema,
  student_id: IdSchema,
});

export type Enrollment = z.infer<typeof EnrollmentSchema>;
