import type { AxiosError } from 'axios';

type ApiErrorBody = { detail?: string; message?: string };

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  const apiError = error as AxiosError<ApiErrorBody>;
  const message = apiError.response?.data?.detail ?? apiError.response?.data?.message;
  if (typeof message === 'string') return message;
  if (!apiError.response && apiError.message?.includes('API address')) return apiError.message;
  if (!apiError.response && apiError.code === 'ECONNABORTED') return 'The request timed out. Check your connection and try again.';
  if (!apiError.response) return 'Could not reach Kezza. Check that the API is running and the phone can reach its network address.';
  return fallback;
}
