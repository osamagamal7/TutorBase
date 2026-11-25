import {
  QuestionSchema,
  QuizAttemptSchema,
  QuizForStudentSchema,
  QuizInputSchema,
  QuizSchema,
} from '@tutorbase/shared';

import type { ApiClient, QuizDetail } from './client';
import {
  db,
  findEnrollment,
  requireCourse,
  requireOwner,
  requireUser,
} from './db';
import { apiError } from './errors';
import { readInput } from './parse';
import { run } from './delay';

function questionsFor(quizId: string) {
  return db.questions
    .filter((question) => question.quiz_id === quizId)
    .sort((a, b) => a.position - b.position);
}

function storeQuestions(
  quizId: string,
  questions: ReturnType<typeof QuizInputSchema.parse>['questions'],
) {
  db.questions = db.questions.filter((question) => question.quiz_id !== quizId);
  const stored = questions.map((question, position) =>
    QuestionSchema.parse({
      id: crypto.randomUUID(),
      quiz_id: quizId,
      position,
      prompt: question.prompt,
      options: question.options,
      correct_index: question.correct_index,
      explanation: question.explanation,
    }),
  );
  db.questions.push(...stored);
  return stored;
}

function tutorQuiz(quizId: string): QuizDetail {
  const quiz = db.quizzes.find((item) => item.id === quizId);
  if (!quiz) throw apiError('NOT_FOUND', 'Quiz not found');
  return {
    ...quiz,
    questions: questionsFor(quiz.id).map((question) => ({ ...question })),
  };
}

function canSeeCourse(courseId: string, userId: string) {
  const course = requireCourse(courseId);
  return (
    course.tutor_id === userId || Boolean(findEnrollment(courseId, userId))
  );
}

export const quizApi: Pick<
  ApiClient,
  | 'quizzes'
  | 'createQuiz'
  | 'quiz'
  | 'updateQuiz'
  | 'publishQuiz'
  | 'deleteQuiz'
  | 'submitAttempt'
  | 'myAttempts'
> = {
  quizzes(courseId) {
    return run(() => {
      const user = requireUser();
      const course = requireCourse(courseId);
      if (!canSeeCourse(course.id, user.id)) {
        throw apiError('FORBIDDEN', 'Enroll to see these quizzes');
      }
      const owner = course.tutor_id === user.id;
      return db.quizzes
        .filter((quiz) => quiz.course_id === course.id)
        .filter((quiz) => owner || quiz.status === 'published')
        .map((quiz) => ({
          ...quiz,
          question_count: questionsFor(quiz.id).length,
        }));
    });
  },

  createQuiz(courseId, input) {
    return run(() => {
      const user = requireUser();
      const course = requireCourse(courseId);
      requireOwner(course, user);
      const parsed = readInput(QuizInputSchema, input);
      const quiz = QuizSchema.parse({
        id: crypto.randomUUID(),
        course_id: course.id,
        title: parsed.title,
        status: 'draft',
        pass_score: parsed.pass_score,
      });
      db.quizzes.push(quiz);
      storeQuestions(quiz.id, parsed.questions);
      return tutorQuiz(quiz.id);
    });
  },

  quiz(id) {
    return run(() => {
      const user = requireUser();
      const quiz = db.quizzes.find((item) => item.id === id);
      if (!quiz) throw apiError('NOT_FOUND', 'Quiz not found');
      const course = requireCourse(quiz.course_id);
      const owner = course.tutor_id === user.id;
      if (!owner && !findEnrollment(course.id, user.id)) {
        throw apiError('FORBIDDEN', 'Enroll to take this quiz');
      }
      if (!owner && quiz.status !== 'published') {
        throw apiError('NOT_FOUND', 'Quiz not found');
      }
      if (owner) return tutorQuiz(quiz.id);
      return QuizForStudentSchema.parse({
        ...quiz,
        questions: questionsFor(quiz.id).map((question) => ({
          id: question.id,
          quiz_id: question.quiz_id,
          position: question.position,
          prompt: question.prompt,
          options: question.options,
        })),
      });
    });
  },

  updateQuiz(id, input) {
    return run(() => {
      const user = requireUser();
      const quiz = db.quizzes.find((item) => item.id === id);
      if (!quiz) throw apiError('NOT_FOUND', 'Quiz not found');
      requireOwner(requireCourse(quiz.course_id), user);
      const parsed = readInput(QuizInputSchema, input);
      quiz.title = parsed.title;
      quiz.pass_score = parsed.pass_score;
      storeQuestions(quiz.id, parsed.questions);
      return tutorQuiz(quiz.id);
    });
  },

  publishQuiz(id) {
    return run(() => {
      const user = requireUser();
      const quiz = db.quizzes.find((item) => item.id === id);
      if (!quiz) throw apiError('NOT_FOUND', 'Quiz not found');
      requireOwner(requireCourse(quiz.course_id), user);
      if (questionsFor(quiz.id).length < 1) {
        throw apiError('QUIZ_NOT_READY', 'Add a question before publishing');
      }
      quiz.status = 'published';
      return { ...quiz };
    });
  },

  deleteQuiz(id) {
    return run(() => {
      const user = requireUser();
      const quiz = db.quizzes.find((item) => item.id === id);
      if (!quiz) throw apiError('NOT_FOUND', 'Quiz not found');
      requireOwner(requireCourse(quiz.course_id), user);
      db.questions = db.questions.filter(
        (question) => question.quiz_id !== quiz.id,
      );
      db.attempts = db.attempts.filter(
        (attempt) => attempt.quiz_id !== quiz.id,
      );
      db.quizzes = db.quizzes.filter((item) => item.id !== quiz.id);
    });
  },

  submitAttempt(quizId, input) {
    return run(() => {
      const user = requireUser();
      const quiz = db.quizzes.find((item) => item.id === quizId);
      if (!quiz) throw apiError('NOT_FOUND', 'Quiz not found');
      if (!findEnrollment(quiz.course_id, user.id)) {
        throw apiError('NOT_ENROLLED', 'You are not enrolled');
      }
      if (quiz.status !== 'published') {
        throw apiError('NOT_FOUND', 'Quiz not found');
      }
      const questions = questionsFor(quiz.id);
      if (input.answers.length !== questions.length) {
        throw apiError('VALIDATION_ERROR', 'Answer every question');
      }
      const correct = questions.filter(
        (question, index) => input.answers[index] === question.correct_index,
      ).length;
      const outOfRange = questions.some(
        (question, index) =>
          input.answers[index] < 0 ||
          input.answers[index] >= question.options.length,
      );
      if (outOfRange) {
        throw apiError('VALIDATION_ERROR', 'Invalid input');
      }
      const attempt = QuizAttemptSchema.parse({
        id: crypto.randomUUID(),
        quiz_id: quiz.id,
        student_id: user.id,
        answers: input.answers,
        score: Math.round((correct / questions.length) * 100),
      });
      db.attempts.push(attempt);
      return { ...attempt };
    });
  },

  myAttempts(quizId) {
    return run(() => {
      const user = requireUser();
      const quiz = db.quizzes.find((item) => item.id === quizId);
      if (!quiz) throw apiError('NOT_FOUND', 'Quiz not found');
      if (!findEnrollment(quiz.course_id, user.id)) {
        throw apiError('NOT_ENROLLED', 'You are not enrolled');
      }
      return db.attempts
        .filter(
          (attempt) =>
            attempt.quiz_id === quiz.id && attempt.student_id === user.id,
        )
        .map((attempt) => ({ ...attempt }));
    });
  },
};
