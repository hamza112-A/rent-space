import { AxiosError } from 'axios';

// The backend's error middleware responds with { success: false, error: { message, details? } }
// (see urdu-rent-space-backend/src/middleware/errorMiddleware.js) — `details` is field-keyed
// (e.g. { email: ['email must be a valid email address'] }) for validation failures, so forms
// can map server-side errors back to the specific react-hook-form field.
interface ApiErrorBody {
  success: false;
  error: { message: string; details?: Record<string, string[]>; code?: string };
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as AxiosError<ApiErrorBody>;
    return axiosErr.response?.data?.error?.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function getApiErrorDetails(error: unknown): Record<string, string[]> | undefined {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as AxiosError<ApiErrorBody>;
    return axiosErr.response?.data?.error?.details;
  }
  if (error && typeof error === 'object' && 'details' in error) {
    return (error as { details?: Record<string, string[]> }).details;
  }
  return undefined;
}
