import {
  LoginInputSchema,
  RegisterInputSchema,
  SettingsInputSchema,
  TutorProfileSchema,
  UserSchema,
} from '@tutorbase/shared';

import type { ApiClient } from './client';
import { db, requireUser } from './db';
import { apiError } from './errors';
import { readInput } from './parse';
import { run } from './delay';

const TutorProfileInputSchema = TutorProfileSchema.pick({
  bio: true,
  meeting_link: true,
  session_minutes: true,
});

function findByEmail(email: string) {
  return db.users.find((user) => user.email === email);
}

export const authApi: Pick<
  ApiClient,
  | 'register'
  | 'login'
  | 'logout'
  | 'me'
  | 'updateMe'
  | 'exportMe'
  | 'deleteMe'
  | 'myCourses'
  | 'tutorProfile'
  | 'updateTutorProfile'
> = {
  register(input) {
    return run(() => {
      const parsed = readInput(RegisterInputSchema, input);
      if (findByEmail(parsed.email)) {
        throw apiError('EMAIL_IN_USE', 'Email already in use');
      }
      const timezone =
        typeof window === 'undefined'
          ? 'UTC'
          : Intl.DateTimeFormat().resolvedOptions().timeZone;
      const user = UserSchema.parse({
        id: crypto.randomUUID(),
        email: parsed.email,
        name: parsed.name,
        role: parsed.role,
        locale: 'en',
        timezone,
      });
      db.users.push(user);
      db.passwords.set(user.email, parsed.password);
      if (user.role === 'tutor') {
        db.profiles.push(
          TutorProfileSchema.parse({
            user_id: user.id,
            bio: '',
            meeting_link: '',
            session_minutes: 60,
          }),
        );
      }
      db.currentUserId = user.id;
      return { ...user };
    });
  },

  login(input) {
    return run(() => {
      const parsed = readInput(LoginInputSchema, input);
      const user = findByEmail(parsed.email);
      const password = user ? db.passwords.get(user.email) : undefined;
      if (!user || password !== parsed.password) {
        throw apiError('INVALID_CREDENTIALS', 'Email or password is incorrect');
      }
      db.currentUserId = user.id;
      return { ...user };
    });
  },

  logout() {
    return run(() => {
      db.currentUserId = null;
    });
  },

  me() {
    return run(() => ({ ...requireUser() }));
  },

  updateMe(input) {
    return run(() => {
      const user = requireUser();
      const parsed = readInput(SettingsInputSchema, input);
      user.name = parsed.name;
      user.locale = parsed.locale;
      user.timezone = parsed.timezone;
      return { ...user };
    });
  },

  exportMe() {
    return run(() => {
      const user = requireUser();
      return {
        user: { ...user },
        tutor_profile:
          db.profiles.find((profile) => profile.user_id === user.id) ?? null,
        enrollments: db.enrollments.filter(
          (enrollment) => enrollment.student_id === user.id,
        ),
        bookings: db.bookings.filter(
          (booking) =>
            booking.student_id === user.id || booking.tutor_id === user.id,
        ),
        quiz_attempts: db.attempts.filter(
          (attempt) => attempt.student_id === user.id,
        ),
      };
    });
  },

  deleteMe(input) {
    return run(() => {
      const user = requireUser();
      if (db.passwords.get(user.email) !== input.password) {
        throw apiError('INVALID_CREDENTIALS', 'Email or password is incorrect');
      }
      const ownedIds = db.courses
        .filter((course) => course.tutor_id === user.id)
        .map((course) => course.id);
      const blocked = db.courses.some(
        (course) =>
          course.tutor_id === user.id &&
          course.status === 'published' &&
          db.enrollments.some(
            (enrollment) => enrollment.course_id === course.id,
          ),
      );
      if (blocked) {
        throw apiError(
          'UNPUBLISH_REQUIRED',
          'Unpublish courses that still have students before deleting your account',
        );
      }
      const owned = new Set(ownedIds);
      const quizIds = new Set(
        db.quizzes
          .filter((quiz) => owned.has(quiz.course_id))
          .map((quiz) => quiz.id),
      );
      db.questions = db.questions.filter(
        (question) => !quizIds.has(question.quiz_id),
      );
      db.attempts = db.attempts.filter(
        (attempt) =>
          !quizIds.has(attempt.quiz_id) && attempt.student_id !== user.id,
      );
      db.quizzes = db.quizzes.filter((quiz) => !quizIds.has(quiz.id));
      db.materials = db.materials.filter(
        (material) => !owned.has(material.course_id),
      );
      db.enrollments = db.enrollments.filter(
        (enrollment) =>
          enrollment.student_id !== user.id && !owned.has(enrollment.course_id),
      );
      const enrollmentIds = new Set(
        db.enrollments.map((enrollment) => enrollment.id),
      );
      const materialIds = new Set(db.materials.map((material) => material.id));
      db.completions = db.completions.filter(
        (completion) =>
          enrollmentIds.has(completion.enrollment_id) &&
          materialIds.has(completion.material_id),
      );
      db.bookings = db.bookings.filter(
        (booking) =>
          booking.tutor_id !== user.id &&
          booking.student_id !== user.id &&
          !owned.has(booking.course_id),
      );
      db.courses = db.courses.filter((course) => course.tutor_id !== user.id);
      db.availability = db.availability.filter(
        (rule) => rule.tutor_id !== user.id,
      );
      db.profiles = db.profiles.filter(
        (profile) => profile.user_id !== user.id,
      );
      db.users = db.users.filter((item) => item.id !== user.id);
      db.passwords.delete(user.email);
      db.currentUserId = null;
    });
  },

  myCourses() {
    return run(() => {
      const user = requireUser();
      const courses =
        user.role === 'tutor'
          ? db.courses.filter((course) => course.tutor_id === user.id)
          : db.courses.filter((course) =>
              db.enrollments.some(
                (enrollment) =>
                  enrollment.course_id === course.id &&
                  enrollment.student_id === user.id,
              ),
            );
      return courses.map((course) => ({ ...course }));
    });
  },

  tutorProfile() {
    return run(() => {
      const user = requireUser();
      if (user.role !== 'tutor') {
        throw apiError('FORBIDDEN', 'Only tutors have a tutor profile');
      }
      const profile = db.profiles.find((item) => item.user_id === user.id);
      if (!profile) throw apiError('NOT_FOUND', 'Tutor profile not found');
      return { ...profile };
    });
  },

  updateTutorProfile(input) {
    return run(() => {
      const user = requireUser();
      if (user.role !== 'tutor') {
        throw apiError('FORBIDDEN', 'Only tutors have a tutor profile');
      }
      const parsed = readInput(TutorProfileInputSchema, input);
      const profile = db.profiles.find((item) => item.user_id === user.id);
      if (!profile) throw apiError('NOT_FOUND', 'Tutor profile not found');
      profile.bio = parsed.bio;
      profile.meeting_link = parsed.meeting_link;
      profile.session_minutes = parsed.session_minutes;
      return { ...profile };
    });
  },
};
