'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QuizInput } from '@tutorbase/shared';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/api/query-keys';

export function useQuizzes(courseId: string) {
  return useQuery({
    queryKey: queryKeys.quizzes.list(courseId),
    queryFn: () => api.quizzes(courseId),
    enabled: courseId.length > 0,
  });
}

export function useQuiz(id: string) {
  return useQuery({
    queryKey: queryKeys.quizzes.detail(id),
    queryFn: () => api.quiz(id),
    enabled: id.length > 0,
  });
}

export function useMyAttempts(quizId: string) {
  return useQuery({
    queryKey: queryKeys.quizzes.attempts(quizId),
    queryFn: () => api.myAttempts(quizId),
    enabled: quizId.length > 0,
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, input }: { courseId: string; input: QuizInput }) =>
      api.createQuiz(courseId, input),
    onSuccess: (quiz) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.quizzes.list(quiz.course_id),
      }),
  });
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: QuizInput }) =>
      api.updateQuiz(id, input),
    onSuccess: (quiz) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.quizzes.detail(quiz.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.quizzes.list(quiz.course_id),
        }),
      ]),
  });
}

export function usePublishQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.publishQuiz(id),
    onSuccess: (quiz) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.quizzes.detail(quiz.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.quizzes.list(quiz.course_id),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.progress.all }),
      ]),
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteQuiz(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.progress.all }),
      ]),
  });
}

export function useSubmitAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      quizId,
      input,
    }: {
      quizId: string;
      input: { answers: number[] };
    }) => api.submitAttempt(quizId, input),
    onSuccess: (attempt) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.quizzes.attempts(attempt.quiz_id),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.progress.all }),
      ]),
  });
}
