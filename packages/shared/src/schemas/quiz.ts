import { z } from 'zod';

import { IdSchema, PublishStatusSchema } from './common';

const questionShape = {
  id: IdSchema,
  quiz_id: IdSchema,
  position: z.int().min(0),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  correct_index: z.int().min(0),
  /** Null when the tutor did not write one. Shown only after the student submits. */
  explanation: z.string().nullable(),
};

export const QuestionSchema = z
  .object(questionShape)
  .superRefine((question, ctx) => {
    if (question.correct_index >= question.options.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['correct_index'],
        message: 'correct_index must point at one of the options',
      });
    }
  });

export type Question = z.infer<typeof QuestionSchema>;

export const QuestionForStudentSchema = z.object(questionShape).omit({
  correct_index: true,
  explanation: true,
});

export type QuestionForStudent = z.infer<typeof QuestionForStudentSchema>;

export const QuizSchema = z.object({
  id: IdSchema,
  course_id: IdSchema,
  title: z.string().min(1),
  status: PublishStatusSchema,
  pass_score: z.int().min(0).max(100),
});

export type Quiz = z.infer<typeof QuizSchema>;

export const QuizForStudentSchema = QuizSchema.extend({
  questions: z.array(QuestionForStudentSchema).min(1).max(30),
});

export type QuizForStudent = z.infer<typeof QuizForStudentSchema>;

export const QuizAttemptSchema = z.object({
  id: IdSchema,
  quiz_id: IdSchema,
  student_id: IdSchema,
  answers: z.array(z.int().min(0)),
  score: z.int().min(0).max(100),
});

export type QuizAttempt = z.infer<typeof QuizAttemptSchema>;

export const ProgressSchema = z
  .object({
    materials_done: z.int().min(0),
    materials_total: z.int().min(0),
    quizzes_passed: z.int().min(0),
    quizzes_total: z.int().min(0),
    percent: z.int().min(0).max(100),
  })
  .superRefine((progress, ctx) => {
    if (progress.materials_done > progress.materials_total) {
      ctx.addIssue({
        code: 'custom',
        path: ['materials_done'],
        message: 'materials_done cannot exceed materials_total',
      });
    }
    if (progress.quizzes_passed > progress.quizzes_total) {
      ctx.addIssue({
        code: 'custom',
        path: ['quizzes_passed'],
        message: 'quizzes_passed cannot exceed quizzes_total',
      });
    }
    const total = progress.materials_total + progress.quizzes_total;
    const done = progress.materials_done + progress.quizzes_passed;
    const expected = total === 0 ? 0 : Math.round((done / total) * 100);
    if (progress.percent !== expected) {
      ctx.addIssue({
        code: 'custom',
        path: ['percent'],
        message: 'percent must match the progress formula',
      });
    }
  });

export type Progress = z.infer<typeof ProgressSchema>;
