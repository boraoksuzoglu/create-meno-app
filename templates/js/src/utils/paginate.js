/**
 * Pagination utility
 * ───────────────────
 * Extracts and validates page/limit from query params.
 * Returns full pagination metadata including totalPages, hasNext, hasPrev.
 *
 * Usage (in a service):
 *   const { page, limit, skip } = paginate(req.query);
 *   const [items, total] = await Promise.all([
 *     Model.find().skip(skip).limit(limit),
 *     Model.countDocuments(),
 *   ]);
 *   return paginatedResponse(items, total, page, limit);
 */
export const paginate = (query = {}) => {
  const page  = Math.max(Number(query.page)  || 1, 1);
  const limit = Math.min(Number(query.limit) || 20, 100);
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Wraps a list result with full pagination metadata.
 *
 * @example
 * const { page, limit, skip } = paginate(req.query);
 * const [items, total] = await Promise.all([Model.find().skip(skip).limit(limit), Model.countDocuments()]);
 * return paginatedResponse(items, total, page, limit);
 * // → { items, total, page, limit, totalPages, hasNext, hasPrev }
 */
export const paginatedResponse = (items, total, page, limit) => {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;
  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};
