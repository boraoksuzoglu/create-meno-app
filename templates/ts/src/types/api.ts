/**
 * Common API response shapes.
 */
export interface ApiSuccess<T = unknown> {
  data?: T;
  message?: string;
}

export interface ApiError {
  status: number;
  message: string;
  stack?: string;
}
