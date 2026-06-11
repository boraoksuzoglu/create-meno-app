/**
 * Shared pagination types.
 * Matches the shape returned by paginatedResponse() in @/utils/paginate.ts
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}
