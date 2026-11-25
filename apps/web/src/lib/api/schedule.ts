import {
  AvailabilityInputSchema,
  AvailabilityRuleSchema,
  BookingInputSchema,
  BookingSchema,
  TimestampSchema,
} from '@tutorbase/shared';

import type { ApiClient, BookingView } from './client';
import { db, findEnrollment, requireCourse, requireUser, userName } from './db';
import { apiError } from './errors';
import { readInput } from './parse';
import { generateSlots } from './slots';
import { run } from './delay';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

function bookingView(id: string): BookingView {
  const booking = db.bookings.find((item) => item.id === id);
  if (!booking) throw apiError('NOT_FOUND', 'Booking not found');
  const course = db.courses.find((item) => item.id === booking.course_id);
  const profile = db.profiles.find((item) => item.user_id === booking.tutor_id);
  return {
    ...booking,
    student_name: userName(booking.student_id),
    tutor_name: userName(booking.tutor_id),
    course_title: course?.title ?? 'Unknown',
    meeting_link: profile?.meeting_link ?? '',
  };
}

export const scheduleApi: Pick<
  ApiClient,
  | 'availability'
  | 'updateAvailability'
  | 'slots'
  | 'createBooking'
  | 'myBookings'
  | 'cancelBooking'
> = {
  availability() {
    return run(() => {
      const user = requireUser();
      if (user.role !== 'tutor') {
        throw apiError('FORBIDDEN', 'Only tutors set availability');
      }
      return db.availability
        .filter((rule) => rule.tutor_id === user.id)
        .sort(
          (a, b) =>
            a.weekday - b.weekday || a.start_time.localeCompare(b.start_time),
        )
        .map((rule) => ({ ...rule }));
    });
  },

  updateAvailability(input) {
    return run(() => {
      const user = requireUser();
      if (user.role !== 'tutor') {
        throw apiError('FORBIDDEN', 'Only tutors set availability');
      }
      const parsed = readInput(AvailabilityInputSchema, input);
      const rules = parsed.rules.map((rule) =>
        AvailabilityRuleSchema.parse({
          id: crypto.randomUUID(),
          tutor_id: user.id,
          weekday: rule.weekday,
          start_time: rule.start_time,
          end_time: rule.end_time,
        }),
      );
      db.availability = [
        ...db.availability.filter((rule) => rule.tutor_id !== user.id),
        ...rules,
      ];
      return rules.map((rule) => ({ ...rule }));
    });
  },

  slots(courseId, query) {
    return run(() => {
      const user = requireUser();
      const course = requireCourse(courseId);
      if (!findEnrollment(course.id, user.id)) {
        throw apiError('NOT_ENROLLED', 'You are not enrolled');
      }
      const from = readInput(TimestampSchema, query.from);
      const to = readInput(TimestampSchema, query.to);
      if (new Date(from) >= new Date(to)) {
        throw apiError('VALIDATION_ERROR', 'Invalid input');
      }
      const profile = db.profiles.find(
        (item) => item.user_id === course.tutor_id,
      );
      const tutor = db.users.find((item) => item.id === course.tutor_id);
      if (!profile || !tutor) {
        throw apiError('NOT_FOUND', 'Tutor not found');
      }
      return generateSlots({
        timeZone: tutor.timezone,
        sessionMinutes: profile.session_minutes,
        rules: db.availability.filter((rule) => rule.tutor_id === tutor.id),
        bookings: db.bookings.filter(
          (booking) => booking.tutor_id === tutor.id,
        ),
        from: new Date(from),
        to: new Date(to),
      });
    });
  },

  createBooking(input) {
    return run(() => {
      const user = requireUser();
      const parsed = readInput(BookingInputSchema, input);
      const course = requireCourse(parsed.course_id);
      if (!findEnrollment(course.id, user.id)) {
        throw apiError('NOT_ENROLLED', 'You are not enrolled');
      }
      const upcoming = db.bookings.filter(
        (booking) =>
          booking.course_id === course.id &&
          booking.student_id === user.id &&
          booking.status === 'booked' &&
          new Date(booking.starts_at).getTime() > Date.now(),
      );
      if (upcoming.length >= 3) {
        throw apiError(
          'BOOKING_LIMIT',
          'You can have at most 3 upcoming bookings for this course',
        );
      }
      const profile = db.profiles.find(
        (item) => item.user_id === course.tutor_id,
      );
      const tutor = db.users.find((item) => item.id === course.tutor_id);
      if (!profile || !tutor) throw apiError('NOT_FOUND', 'Tutor not found');
      const now = new Date();
      const slots = generateSlots({
        timeZone: tutor.timezone,
        sessionMinutes: profile.session_minutes,
        rules: db.availability.filter((rule) => rule.tutor_id === tutor.id),
        bookings: db.bookings.filter(
          (booking) => booking.tutor_id === tutor.id,
        ),
        from: now,
        to: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000),
      });
      const target = new Date(parsed.starts_at).getTime();
      const slot = slots.find(
        (item) => new Date(item.starts_at).getTime() === target,
      );
      if (!slot) {
        throw apiError(
          'SLOT_TAKEN',
          'This slot was just booked, please pick another',
        );
      }
      const booking = BookingSchema.parse({
        id: crypto.randomUUID(),
        tutor_id: tutor.id,
        student_id: user.id,
        course_id: course.id,
        starts_at: slot.starts_at,
        ends_at: slot.ends_at,
        status: 'booked',
        cancelled_by: null,
        reminder_sent_at: null,
      });
      db.bookings.push(booking);
      return bookingView(booking.id);
    });
  },

  myBookings(scope) {
    return run(() => {
      const user = requireUser();
      const now = Date.now();
      return db.bookings
        .filter(
          (booking) =>
            booking.student_id === user.id || booking.tutor_id === user.id,
        )
        .filter((booking) => {
          const upcoming =
            booking.status === 'booked' &&
            new Date(booking.starts_at).getTime() >= now;
          return scope === 'upcoming' ? upcoming : !upcoming;
        })
        .sort((a, b) =>
          scope === 'upcoming'
            ? a.starts_at.localeCompare(b.starts_at)
            : b.starts_at.localeCompare(a.starts_at),
        )
        .map((booking) => bookingView(booking.id));
    });
  },

  cancelBooking(id) {
    return run(() => {
      const user = requireUser();
      const booking = db.bookings.find((item) => item.id === id);
      if (!booking) throw apiError('NOT_FOUND', 'Booking not found');
      const isTutor = booking.tutor_id === user.id;
      const isStudent = booking.student_id === user.id;
      if (!isTutor && !isStudent) {
        throw apiError('FORBIDDEN', 'You are not part of this booking');
      }
      if (booking.status === 'cancelled') return bookingView(booking.id);
      if (
        !isTutor &&
        new Date(booking.starts_at).getTime() - Date.now() < TWELVE_HOURS_MS
      ) {
        throw apiError(
          'CANCELLATION_TOO_LATE',
          'Students can cancel up to 12 hours before the start',
        );
      }
      booking.status = 'cancelled';
      booking.cancelled_by = user.id;
      return bookingView(booking.id);
    });
  },
};
