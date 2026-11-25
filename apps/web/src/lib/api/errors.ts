import type { ApiError } from '@tutorbase/shared';

/** A failed API call. `code` and `details` match the error body in spec section 8. */
export class ApiRequestError extends Error {
  readonly code: string;
  readonly details: unknown;

  constructor(error: ApiError['error']) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.code = error.code;
    this.details = error.details;
  }
}

export function apiError(code: string, message: string, details?: unknown) {
  return new ApiRequestError({ code, message, details });
}
