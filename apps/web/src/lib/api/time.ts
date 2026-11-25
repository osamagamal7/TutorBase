const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function civilParts(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  const weekday = WEEKDAYS.indexOf(map.weekday as (typeof WEEKDAYS)[number]);
  return {
    weekday,
    date: `${map.year}-${map.month}-${map.day}`,
  };
}

function zoneOffsetMs(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour) % 24,
    Number(map.minute),
    Number(map.second),
  );
  return asUtc - instant.getTime();
}

/** A clock time in an IANA zone, as a UTC instant. */
export function zonedToUtc(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const corrected = new Date(
    utcGuess.getTime() - zoneOffsetMs(utcGuess, timeZone),
  );
  return new Date(utcGuess.getTime() - zoneOffsetMs(corrected, timeZone));
}

export function addCivilDays(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

export function addMinutes(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

export function weekdayOf(date: string, timeZone: string) {
  return civilParts(zonedToUtc(date, '12:00', timeZone), timeZone).weekday;
}

export function weekdayInstant(
  weekday: number,
  time: string,
  timeZone: string,
  direction: 'future' | 'past',
) {
  const step = direction === 'future' ? 1 : -1;
  const start = direction === 'future' ? 2 : 1;
  for (let days = start; days <= 40; days += 1) {
    const probe = new Date(Date.now() + step * days * 86_400_000);
    const civil = civilParts(probe, timeZone);
    if (civil.weekday === weekday) {
      return zonedToUtc(civil.date, time, timeZone).toISOString();
    }
  }
  throw new Error(`No ${direction} weekday ${weekday}`);
}
