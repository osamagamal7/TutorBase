import type { Course, User } from '@tutorbase/shared';

import { apiError } from './errors';
import {
  DEMO_PASSWORD,
  seedAttempts,
  seedAvailability,
  seedBookings,
  seedCompletions,
  seedCourses,
  seedEnrollments,
  seedMaterials,
  seedProfiles,
  seedQuestions,
  seedQuizzes,
  seedUsers,
  type Completion,
} from './fixtures';

export const db = {
  users: seedUsers.map((user) => ({ ...user })),
  passwords: new Map(seedUsers.map((user) => [user.email, DEMO_PASSWORD])),
  currentUserId: null as string | null,
  profiles: seedProfiles.map((profile) => ({ ...profile })),
  courses: seedCourses.map((course) => ({ ...course })),
  materials: seedMaterials.map((material) => ({ ...material })),
  enrollments: seedEnrollments.map((enrollment) => ({ ...enrollment })),
  completions: seedCompletions.map((completion) => ({ ...completion })),
  availability: seedAvailability.map((rule) => ({ ...rule })),
  bookings: seedBookings.map((booking) => ({ ...booking })),
  quizzes: seedQuizzes.map((quiz) => ({ ...quiz })),
  questions: seedQuestions.map((question) => ({ ...question })),
  attempts: seedAttempts.map((attempt) => ({ ...attempt })),
};

export function requireUser(): User {
  const user = db.users.find((item) => item.id === db.currentUserId);
  if (!user) throw apiError('UNAUTHENTICATED', 'Sign in required');
  return user;
}

export function requireCourse(id: string): Course {
  const course = db.courses.find((item) => item.id === id);
  if (!course) throw apiError('NOT_FOUND', 'Course not found');
  return course;
}

export function requireOwner(course: Course, user: User) {
  if (course.tutor_id !== user.id) {
    throw apiError('FORBIDDEN', 'You do not own this course');
  }
}

export function findEnrollment(courseId: string, studentId: string) {
  return db.enrollments.find(
    (enrollment) =>
      enrollment.course_id === courseId && enrollment.student_id === studentId,
  );
}

export function userName(id: string) {
  return db.users.find((user) => user.id === id)?.name ?? 'Unknown';
}

export function completionsFor(enrollmentId: string): Completion[] {
  return db.completions.filter(
    (completion) => completion.enrollment_id === enrollmentId,
  );
}
