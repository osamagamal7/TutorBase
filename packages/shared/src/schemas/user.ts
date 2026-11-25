import { z } from 'zod';

import { IdSchema, TimezoneSchema } from './common';

export const UserSchema = z.object({
  id: IdSchema,
  email: z.email(),
  name: z.string().min(2),
  role: z.enum(['student', 'tutor', 'admin']),
  locale: z.string(),
  timezone: TimezoneSchema,
});

export type User = z.infer<typeof UserSchema>;

export const TutorProfileSchema = z.object({
  user_id: IdSchema,
  bio: z.string(),
  meeting_link: z.union([z.url(), z.literal('')]),
  session_minutes: z.literal([30, 45, 60]),
});

export type TutorProfile = z.infer<typeof TutorProfileSchema>;
