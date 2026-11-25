'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CourseInput } from '@tutorbase/shared';

import { api } from '@/lib/api';
import type { CourseQuery } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';

export function useCourses(query: CourseQuery = {}) {
  return useQuery({
    queryKey: queryKeys.courses.list(query),
    queryFn: () => api.courses(query),
  });
}

export function useCourse(slug: string) {
  return useQuery({
    queryKey: queryKeys.courses.detail(slug),
    queryFn: () => api.course(slug),
    enabled: slug.length > 0,
  });
}

export function useCourseStudents(courseId: string) {
  return useQuery({
    queryKey: queryKeys.courses.students(courseId),
    queryFn: () => api.courseStudents(courseId),
    enabled: courseId.length > 0,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Pick<CourseInput, 'title'>) => api.createCourse(input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myCourses }),
      ]),
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CourseInput }) =>
      api.updateCourse(id, input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myCourses }),
      ]),
  });
}

export function usePublishCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.publishCourse(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myCourses }),
      ]),
  });
}

export function useUnpublishCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.unpublishCourse(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myCourses }),
      ]),
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteCourse(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myCourses }),
      ]),
  });
}
