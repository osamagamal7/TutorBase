import type { ApiClient } from './client';
import { authApi } from './auth';
import { catalogApi } from './catalog';
import { run } from './delay';
import { learningApi } from './learning';
import { quizApi } from './quizzes';
import { scheduleApi } from './schedule';

export const mockApiClient: ApiClient = {
  health: () => run(() => ({ status: 'ok' })),
  ...authApi,
  ...catalogApi,
  ...learningApi,
  ...scheduleApi,
  ...quizApi,
};
