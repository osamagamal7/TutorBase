'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  LoginInput,
  RegisterInput,
  SettingsInput,
} from '@tutorbase/shared';

import { api } from '@/lib/api';
import type { TutorProfileInput } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.me(),
  });
}

export function useMyCourses() {
  return useQuery({
    queryKey: queryKeys.myCourses,
    queryFn: () => api.myCourses(),
  });
}

export function useTutorProfile() {
  return useQuery({
    queryKey: queryKeys.tutorProfile,
    queryFn: () => api.tutorProfile(),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) => api.register(input),
    onSuccess: (user) => {
      queryClient.clear();
      queryClient.setQueryData(queryKeys.me, user);
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => api.login(input),
    onSuccess: (user) => {
      queryClient.clear();
      queryClient.setQueryData(queryKeys.me, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SettingsInput) => api.updateMe(input),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me, user);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
      ]);
    },
  });
}

export function useExportMe() {
  return useMutation({
    mutationFn: () => api.exportMe(),
  });
}

export function useDeleteMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { password: string }) => api.deleteMe(input),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useUpdateTutorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TutorProfileInput) => api.updateTutorProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.tutorProfile, profile);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
      ]);
    },
  });
}
