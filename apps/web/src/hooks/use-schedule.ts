'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AvailabilityInput, BookingInput } from '@tutorbase/shared';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/api/query-keys';

export function useAvailability() {
  return useQuery({
    queryKey: queryKeys.availability,
    queryFn: () => api.availability(),
  });
}

export function useSlots(
  courseId: string,
  query: { from: string; to: string },
) {
  return useQuery({
    queryKey: queryKeys.slots.list(courseId, query),
    queryFn: () => api.slots(courseId, query),
    enabled:
      courseId.length > 0 && query.from.length > 0 && query.to.length > 0,
  });
}

export function useMyBookings(scope: 'upcoming' | 'past') {
  return useQuery({
    queryKey: queryKeys.bookings.list(scope),
    queryFn: () => api.myBookings(scope),
  });
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AvailabilityInput) => api.updateAvailability(input),
    onSuccess: (rules) => {
      queryClient.setQueryData(queryKeys.availability, rules);
      return queryClient.invalidateQueries({ queryKey: queryKeys.slots.all });
    },
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BookingInput) => api.createBooking(input),
    onSuccess: (booking) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.slots.course(booking.course_id),
        }),
      ]),
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.cancelBooking(id),
    onSuccess: (booking) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.slots.course(booking.course_id),
        }),
      ]),
  });
}
