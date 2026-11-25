import type { Slot } from '@tutorbase/shared';

import { addCivilDays, civilParts, weekdayOf, zonedToUtc } from './time';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const TWENTY_EIGHT_DAYS_MS = 28 * 24 * 60 * 60 * 1000;

type Window = {
  weekday: number;
  start_time: string;
  end_time: string;
};

type Busy = {
  starts_at: string;
  ends_at: string;
  status: string;
};

function minutesOf(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

function formatMinutes(total: number) {
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function overlaps(start: number, end: number, booking: Busy) {
  return (
    start < new Date(booking.ends_at).getTime() &&
    new Date(booking.starts_at).getTime() < end
  );
}

/**
 * Free session starts inside the tutor's weekly windows.
 * Drops anything in the next 12 hours, anything past 28 days,
 * and anything that overlaps a booking that is still `booked`.
 */
export function generateSlots(options: {
  timeZone: string;
  sessionMinutes: number;
  rules: Window[];
  bookings: Busy[];
  from: Date;
  to: Date;
  now?: Date;
}): Slot[] {
  const now = options.now ?? new Date();
  const earliest = new Date(now.getTime() + TWELVE_HOURS_MS);
  const horizon = new Date(now.getTime() + TWENTY_EIGHT_DAYS_MS);
  const rangeStart = options.from > earliest ? options.from : earliest;
  const rangeEnd = options.to < horizon ? options.to : horizon;
  if (rangeStart >= rangeEnd) return [];

  let date = civilParts(rangeStart, options.timeZone).date;
  const lastDate = civilParts(
    new Date(rangeEnd.getTime() - 1),
    options.timeZone,
  ).date;
  const slots: Slot[] = [];

  for (; date <= lastDate; date = addCivilDays(date, 1)) {
    const weekday = weekdayOf(date, options.timeZone);
    for (const rule of options.rules) {
      if (rule.weekday !== weekday) continue;
      const windowStart = minutesOf(rule.start_time);
      const windowEnd = minutesOf(rule.end_time);
      for (
        let minute = windowStart;
        minute + options.sessionMinutes <= windowEnd;
        minute += options.sessionMinutes
      ) {
        const starts = zonedToUtc(
          date,
          formatMinutes(minute),
          options.timeZone,
        );
        const ends = new Date(
          starts.getTime() + options.sessionMinutes * 60_000,
        );
        if (starts < rangeStart || starts >= rangeEnd) continue;
        const blocked = options.bookings.some(
          (booking) =>
            booking.status === 'booked' &&
            overlaps(starts.getTime(), ends.getTime(), booking),
        );
        if (blocked) continue;
        slots.push({
          starts_at: starts.toISOString(),
          ends_at: ends.toISOString(),
        });
      }
    }
  }

  return slots.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}
