import { apiError } from './errors';

export function readInput<T>(
  schema: {
    safeParse(
      data: unknown,
    ):
      | { success: true; data: T }
      | { success: false; error: { flatten(): unknown } };
  },
  input: unknown,
): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw apiError('VALIDATION_ERROR', 'Invalid input', result.error.flatten());
  }
  return result.data;
}
