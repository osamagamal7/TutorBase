import {
  CourseInputSchema,
  CourseListItemSchema,
  CourseSchema,
  paginatedSchema,
} from '@tutorbase/shared';

import type { ApiClient } from './client';
import {
  db,
  findEnrollment,
  requireCourse,
  requireOwner,
  requireUser,
  userName,
} from './db';
import { apiError } from './errors';
import { courseProgress } from './progress';
import { readInput } from './parse';
import { run } from './delay';

const CreateCourseSchema = CourseInputSchema.pick({ title: true });
const coursePageSchema = paginatedSchema(CourseListItemSchema);

function uniqueSlug(title: string) {
  const base =
    title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'course';
  let slug = base;
  let suffix = 2;
  while (db.courses.some((course) => course.slug === slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

function toListItem(course: (typeof db.courses)[number]) {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    subject: course.subject,
    level: course.level,
    tutor_name: userName(course.tutor_id),
    material_count: db.materials.filter(
      (material) => material.course_id === course.id,
    ).length,
  };
}

export const catalogApi: Pick<
  ApiClient,
  | 'courses'
  | 'course'
  | 'createCourse'
  | 'updateCourse'
  | 'publishCourse'
  | 'unpublishCourse'
  | 'deleteCourse'
  | 'courseStudents'
> = {
  courses(query = {}) {
    return run(() => {
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 12;
      if (page < 1 || pageSize < 1) {
        throw apiError('VALIDATION_ERROR', 'Invalid input');
      }
      const q = query.q?.trim().toLowerCase();
      const filtered = db.courses
        .filter((course) => course.status === 'published')
        .filter((course) =>
          query.subject ? course.subject === query.subject : true,
        )
        .filter((course) => (query.level ? course.level === query.level : true))
        .filter((course) =>
          query.language ? course.language === query.language : true,
        )
        .filter((course) => {
          if (!q) return true;
          return (
            course.title.toLowerCase().includes(q) ||
            course.description.toLowerCase().includes(q)
          );
        })
        .sort((a, b) =>
          (b.published_at ?? '').localeCompare(a.published_at ?? ''),
        );
      const start = (page - 1) * pageSize;
      return coursePageSchema.parse({
        items: filtered.slice(start, start + pageSize).map(toListItem),
        page,
        pageSize,
        total: filtered.length,
      });
    });
  },

  course(slug) {
    return run(() => {
      const course = db.courses.find((item) => item.slug === slug);
      const viewer = db.users.find((user) => user.id === db.currentUserId);
      if (
        !course ||
        (course.status === 'draft' && viewer?.id !== course.tutor_id)
      ) {
        throw apiError('NOT_FOUND', 'Course not found');
      }
      const profile = db.profiles.find(
        (item) => item.user_id === course.tutor_id,
      );
      return {
        ...course,
        tutor_name: userName(course.tutor_id),
        tutor_bio: profile?.bio ?? '',
        material_count: db.materials.filter(
          (material) => material.course_id === course.id,
        ).length,
        quiz_count: db.quizzes.filter(
          (quiz) => quiz.course_id === course.id && quiz.status === 'published',
        ).length,
      };
    });
  },

  createCourse(input) {
    return run(() => {
      const user = requireUser();
      if (user.role !== 'tutor') {
        throw apiError('FORBIDDEN', 'Only tutors can create courses');
      }
      const parsed = readInput(CreateCourseSchema, input);
      const course = CourseSchema.parse({
        id: crypto.randomUUID(),
        tutor_id: user.id,
        title: parsed.title,
        slug: uniqueSlug(parsed.title),
        description: '',
        subject: 'Other',
        level: 'Beginner',
        language: 'en',
        status: 'draft',
        published_at: null,
      });
      db.courses.push(course);
      return { ...course };
    });
  },

  updateCourse(id, input) {
    return run(() => {
      const user = requireUser();
      const course = requireCourse(id);
      requireOwner(course, user);
      const parsed = readInput(CourseInputSchema, input);
      course.title = parsed.title;
      course.description = parsed.description;
      course.subject = parsed.subject;
      course.level = parsed.level;
      course.language = parsed.language;
      return { ...course };
    });
  },

  publishCourse(id) {
    return run(() => {
      const user = requireUser();
      const course = requireCourse(id);
      requireOwner(course, user);
      const materials = db.materials.filter(
        (material) => material.course_id === course.id,
      );
      if (materials.length === 0) {
        throw apiError('COURSE_NOT_READY', 'Add a material before publishing');
      }
      course.status = 'published';
      course.published_at ??= new Date().toISOString();
      return { ...course };
    });
  },

  unpublishCourse(id) {
    return run(() => {
      const user = requireUser();
      const course = requireCourse(id);
      requireOwner(course, user);
      course.status = 'draft';
      return { ...course };
    });
  },

  deleteCourse(id) {
    return run(() => {
      const user = requireUser();
      const course = requireCourse(id);
      requireOwner(course, user);
      if (course.status !== 'draft') {
        throw apiError(
          'COURSE_NOT_DRAFT',
          'Unpublish the course before deleting it',
        );
      }
      if (
        findEnrollment(course.id, user.id) ||
        db.enrollments.some((enrollment) => enrollment.course_id === course.id)
      ) {
        throw apiError('COURSE_HAS_STUDENTS', 'This course still has students');
      }
      const quizIds = new Set(
        db.quizzes
          .filter((quiz) => quiz.course_id === course.id)
          .map((quiz) => quiz.id),
      );
      db.questions = db.questions.filter(
        (question) => !quizIds.has(question.quiz_id),
      );
      db.attempts = db.attempts.filter(
        (attempt) => !quizIds.has(attempt.quiz_id),
      );
      db.quizzes = db.quizzes.filter((quiz) => quiz.course_id !== course.id);
      const materialIds = new Set(
        db.materials
          .filter((material) => material.course_id === course.id)
          .map((material) => material.id),
      );
      db.materials = db.materials.filter(
        (material) => material.course_id !== course.id,
      );
      db.completions = db.completions.filter(
        (completion) => !materialIds.has(completion.material_id),
      );
      db.courses = db.courses.filter((item) => item.id !== course.id);
    });
  },

  courseStudents(courseId) {
    return run(() => {
      const user = requireUser();
      const course = requireCourse(courseId);
      requireOwner(course, user);
      return db.enrollments
        .filter((enrollment) => enrollment.course_id === course.id)
        .map((enrollment) => {
          const activity = db.completions
            .filter((completion) => completion.enrollment_id === enrollment.id)
            .map((completion) => completion.completed_at)
            .sort()
            .at(-1);
          return {
            student_id: enrollment.student_id,
            name: userName(enrollment.student_id),
            progress: courseProgress(course.id, enrollment.student_id),
            last_activity_at: activity ?? null,
          };
        });
    });
  },
};
