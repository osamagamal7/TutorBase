import type { CourseQuery } from './client';

export const queryKeys = {
  health: ['health'] as const,
  me: ['me'] as const,
  myCourses: ['me', 'courses'] as const,
  tutorProfile: ['me', 'tutor-profile'] as const,
  courses: {
    all: ['courses'] as const,
    list: (query: CourseQuery = {}) => ['courses', 'list', query] as const,
    detail: (slug: string) => ['courses', 'detail', slug] as const,
    studentsAll: ['courses', 'students'] as const,
    students: (courseId: string) => ['courses', 'students', courseId] as const,
  },
  materials: {
    all: ['materials'] as const,
    list: (courseId: string) => ['materials', courseId] as const,
  },
  progress: {
    all: ['progress'] as const,
    course: (courseId: string) => ['progress', courseId] as const,
  },
  availability: ['availability'] as const,
  slots: {
    all: ['slots'] as const,
    course: (courseId: string) => ['slots', courseId] as const,
    list: (courseId: string, query: { from: string; to: string }) =>
      ['slots', courseId, query] as const,
  },
  bookings: {
    all: ['bookings'] as const,
    list: (scope: 'upcoming' | 'past') => ['bookings', scope] as const,
  },
  quizzes: {
    all: ['quizzes'] as const,
    list: (courseId: string) => ['quizzes', 'list', courseId] as const,
    detail: (id: string) => ['quizzes', 'detail', id] as const,
    attempts: (quizId: string) => ['quizzes', 'attempts', quizId] as const,
  },
};
