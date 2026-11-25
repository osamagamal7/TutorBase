import type { ApiClient } from './client';
import { mockApiClient } from './mock';

export type {
  AccountExport,
  ApiClient,
  BookingView,
  CourseDetail,
  CourseQuery,
  CourseStudent,
  MaterialCreate,
  MaterialPatch,
  MaterialUpload,
  MaterialUploadInput,
  QuizDetail,
  QuizSummary,
  TutorProfileInput,
} from './client';
export { ApiRequestError } from './errors';
export { mockApiClient };

/** The client screens use. Swap this for the HTTP client in TB-036. */
export const api: ApiClient = mockApiClient;
