import { z } from 'zod';

const timeZones = new Set(Intl.supportedValuesOf('timeZone'));

export const IdSchema = z.uuid();

export const TimestampSchema = z.iso.datetime({ offset: true });

export const TimezoneSchema = z
  .string()
  .refine((value) => timeZones.has(value), {
    message: 'Invalid time zone',
  });

export const LocalTimeSchema = z.iso.time();

export const PublishStatusSchema = z.enum(['draft', 'published']);

export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.int().min(1),
    pageSize: z.int().min(1),
    total: z.int().min(0),
  });
}

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
