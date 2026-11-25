import { z } from 'zod';

import { IdSchema, TimestampSchema } from './common';
import { CourseSchema } from './course';
import { QuizSchema } from './quiz';
import { AvailabilityRuleSchema } from './scheduling';
import { UserSchema } from './user';

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const RegisterInputSchema = z.object({
  role: z.enum(['student', 'tutor']),
  name: z.string().trim().min(2),
  email: emailSchema,
  password: z.string().min(10),
  accepted_terms: z.literal(true),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

export const CourseInputSchema = z.object({
  title: z.string().trim().pipe(CourseSchema.shape.title),
  description: z.string().trim().pipe(CourseSchema.shape.description),
  subject: CourseSchema.shape.subject,
  level: CourseSchema.shape.level,
  language: z.string().trim().pipe(CourseSchema.shape.language),
});

export type CourseInput = z.infer<typeof CourseInputSchema>;

const quizQuestionInputSchema = z
  .object({
    prompt: z.string().trim().min(1),
    options: z.array(z.string().trim().min(1)).min(2).max(6),
    correct_index: z.int().min(0),
    explanation: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((value) => value || null),
  })
  .superRefine((question, ctx) => {
    if (question.correct_index >= question.options.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['correct_index'],
        message: 'correct_index must point at one of the options',
      });
    }
  });

export const QuizInputSchema = z.object({
  title: z.string().trim().pipe(QuizSchema.shape.title),
  pass_score: QuizSchema.shape.pass_score.default(70),
  questions: z.array(quizQuestionInputSchema).min(1).max(30),
});

export type QuizInput = z.infer<typeof QuizInputSchema>;

const availabilityWindowSchema = z
  .object({
    weekday: AvailabilityRuleSchema.shape.weekday,
    start_time: AvailabilityRuleSchema.shape.start_time,
    end_time: AvailabilityRuleSchema.shape.end_time,
  })
  .superRefine((window, ctx) => {
    if (window.start_time >= window.end_time) {
      ctx.addIssue({
        code: 'custom',
        path: ['end_time'],
        message: 'end_time must be after start_time on the same day',
      });
    }
  });

export const AvailabilityInputSchema = z.object({
  rules: z.array(availabilityWindowSchema).superRefine((rules, ctx) => {
    const byDay = new Map<number, number[]>();
    rules.forEach((rule, index) => {
      const indexes = byDay.get(rule.weekday) ?? [];
      indexes.push(index);
      byDay.set(rule.weekday, indexes);
    });

    for (const indexes of byDay.values()) {
      const ordered = [...indexes].sort((a, b) =>
        rules[a].start_time.localeCompare(rules[b].start_time),
      );
      for (let i = 1; i < ordered.length; i++) {
        const previous = rules[ordered[i - 1]];
        const current = rules[ordered[i]];
        if (current.start_time < previous.end_time) {
          ctx.addIssue({
            code: 'custom',
            path: [ordered[i], 'start_time'],
            message: 'Time ranges on the same day must not overlap',
          });
        }
      }
    }
  }),
});

export type AvailabilityInput = z.infer<typeof AvailabilityInputSchema>;

export const BookingInputSchema = z.object({
  course_id: IdSchema,
  starts_at: TimestampSchema,
});

export type BookingInput = z.infer<typeof BookingInputSchema>;

export const SettingsInputSchema = z.object({
  name: z.string().trim().pipe(UserSchema.shape.name),
  locale: UserSchema.shape.locale,
  timezone: UserSchema.shape.timezone,
});

export type SettingsInput = z.infer<typeof SettingsInputSchema>;
