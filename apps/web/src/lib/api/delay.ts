import { apiError } from './errors';

export async function wait() {
  const ms = 200 + Math.random() * 400;
  await new Promise((resolve) => setTimeout(resolve, ms));

  if (typeof window === 'undefined') return;
  const forced = new URLSearchParams(window.location.search).get('mockError');
  if (forced === '1') {
    throw apiError('MOCK_ERROR', 'Forced mock error');
  }
}

export async function run<T>(fn: () => T): Promise<T> {
  await wait();
  return fn();
}
