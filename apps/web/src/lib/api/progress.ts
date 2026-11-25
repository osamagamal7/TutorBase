import { ProgressSchema } from '@tutorbase/shared';

import { db, findEnrollment } from './db';
import { apiError } from './errors';

export function courseProgress(courseId: string, studentId: string) {
  const enrollment = findEnrollment(courseId, studentId);
  if (!enrollment) throw apiError('NOT_ENROLLED', 'You are not enrolled');
  const materials = db.materials.filter(
    (material) => material.course_id === courseId,
  );
  const materialIds = new Set(materials.map((material) => material.id));
  const materialsDone = db.completions.filter(
    (completion) =>
      completion.enrollment_id === enrollment.id &&
      materialIds.has(completion.material_id),
  ).length;
  const quizzes = db.quizzes.filter(
    (quiz) => quiz.course_id === courseId && quiz.status === 'published',
  );
  const quizzesPassed = quizzes.filter((quiz) => {
    const scores = db.attempts
      .filter(
        (attempt) =>
          attempt.quiz_id === quiz.id && attempt.student_id === studentId,
      )
      .map((attempt) => attempt.score);
    const best = scores.length > 0 ? Math.max(...scores) : 0;
    return best >= quiz.pass_score;
  }).length;
  const total = materials.length + quizzes.length;
  const done = materialsDone + quizzesPassed;
  return ProgressSchema.parse({
    materials_done: materialsDone,
    materials_total: materials.length,
    quizzes_passed: quizzesPassed,
    quizzes_total: quizzes.length,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  });
}
