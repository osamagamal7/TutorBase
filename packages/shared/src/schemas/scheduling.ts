import { z } from 'zod';

import { IdSchema, LocalTimeSchema, TimestampSchema } from './common';

export const AvailabilityRuleSchema = z
  .object({
    id: IdSchema,
    tutor_id: IdSchema,
    weekday: z.int().min(0).max(6),
    start_time: LocalTimeSchema,
    end_time: LocalTimeSchema,
  })
  .superRefine((rule, ctx) => {
    if (rule.start_time >= rule.end_time) {
      ctx.addIssue({
        code: 'custom',
        path: ['end_time'],
        message: 'end_time must be after start_time on the same day',
      });
    }
  });

export type AvailabilityRule = z.infer<typeof AvailabilityRuleSchema>;

export const SlotSchema = z
  .object({
    starts_at: TimestampSchema,
    ends_at: TimestampSchema,
  })
  .superRefine((slot, ctx) => {
    if (Date.parse(slot.ends_at) <= Date.parse(slot.starts_at)) {
      ctx.addIssue({
        code: 'custom',
        path: ['ends_at'],
        message: 'ends_at must be after starts_at',
      });
    }
  });

export type Slot = z.infer<typeof SlotSchema>;

export const BookingSchema = z
  .object({
    id: IdSchema,
    tutor_id: IdSchema,
    student_id: IdSchema,
    course_id: IdSchema,
    starts_at: TimestampSchema,
    ends_at: TimestampSchema,
    status: z.enum(['booked', 'cancelled']),
    cancelled_by: IdSchema.nullable(),
    reminder_sent_at: TimestampSchema.nullable(),
  })
  .superRefine((booking, ctx) => {
    if (Date.parse(booking.ends_at) <= Date.parse(booking.starts_at)) {
      ctx.addIssue({
        code: 'custom',
        path: ['ends_at'],
        message: 'ends_at must be after starts_at',
      });
    }
    if (booking.status === 'booked' && booking.cancelled_by !== null) {
      ctx.addIssue({
        code: 'custom',
        path: ['cancelled_by'],
        message: 'A booked session has no canceller',
      });
    }
  });

export type Booking = z.infer<typeof BookingSchema>;
