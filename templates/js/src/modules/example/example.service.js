import createError from 'http-errors';
import Example from '@/models/example.model.js';
import { paginate, paginatedResponse } from '@/utils/paginate.js';

/** List examples with pagination. */
export const listExamples = async (query = {}) => {
  const { page, limit, skip } = paginate(query);
  const [items, total] = await Promise.all([
    Example.find({ isActive: true }).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Example.countDocuments({ isActive: true }),
  ]);
  return paginatedResponse(items, total, page, limit);
};

/** Get a single example by ID. */
export const getExampleById = async (id) => {
  const item = await Example.findById(id);
  if (!item) throw createError(404, 'EXAMPLE_NOT_FOUND');
  return { item };
};

/** Create a new example. */
export const createExample = async (data) => {
  const item = await Example.create(data);
  return { item };
};

/** Update an existing example. */
export const updateExample = async (
  id,
  data
) => {
  const item = await Example.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  if (!item) throw createError(404, 'EXAMPLE_NOT_FOUND');
  return { item };
};

/** Delete an example (hard delete — swap for soft delete if needed). */
export const deleteExample = async (id) => {
  const item = await Example.findByIdAndDelete(id);
  if (!item) throw createError(404, 'EXAMPLE_NOT_FOUND');
  return { message: 'DELETED' };
};
