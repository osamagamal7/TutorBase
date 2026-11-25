'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type {
  MaterialCreate,
  MaterialPatch,
  MaterialUploadInput,
} from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';

export function useMaterials(courseId: string) {
  return useQuery({
    queryKey: queryKeys.materials.list(courseId),
    queryFn: () => api.materials(courseId),
    enabled: courseId.length > 0,
  });
}

export function useProgress(courseId: string) {
  return useQuery({
    queryKey: queryKeys.progress.course(courseId),
    queryFn: () => api.progress(courseId),
    enabled: courseId.length > 0,
  });
}

export function useEnroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => api.enroll(courseId),
    onSuccess: (enrollment) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.myCourses }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.progress.course(enrollment.course_id),
        }),
      ]),
  });
}

export function useUnenroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => api.unenroll(courseId),
    onSuccess: (_result, courseId) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.myCourses }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.progress.course(courseId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
      ]),
  });
}

export function useCreateMaterialUploadUrl() {
  return useMutation({
    mutationFn: ({
      courseId,
      input,
    }: {
      courseId: string;
      input: MaterialUploadInput;
    }) => api.createMaterialUploadUrl(courseId, input),
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      input,
    }: {
      courseId: string;
      input: MaterialCreate;
    }) => api.createMaterial(courseId, input),
    onSuccess: (material) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.materials.list(material.course_id),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
      ]),
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MaterialPatch }) =>
      api.updateMaterial(id, input),
    onSuccess: (material) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.materials.list(material.course_id),
      }),
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteMaterial(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.materials.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
      ]),
  });
}

export function useMaterialDownloadUrl() {
  return useMutation({
    mutationFn: (id: string) => api.materialDownloadUrl(id),
  });
}

export function useCompleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (materialId: string) => api.completeMaterial(materialId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.progress.all }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.courses.studentsAll,
        }),
      ]),
  });
}

export function useUncompleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (materialId: string) => api.uncompleteMaterial(materialId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.progress.all }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.courses.studentsAll,
        }),
      ]),
  });
}
