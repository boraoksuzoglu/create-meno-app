/**
 * Generates a fully-wired "example" module to demonstrate the MENO pattern.
 * Copy/rename this as a starting point for new modules.
 */
export function generateExampleModule(config) {
  const { language } = config;
  const isTs = language === 'ts';
  const ext = isTs ? 'ts' : 'js';

  return {
    [`__models__/example.model.${ext}`]: generateExampleModel(isTs),
    [`example.validation.${ext}`]: generateExampleValidation(isTs),
    [`example.service.${ext}`]: generateExampleService(isTs),
    [`example.controller.${ext}`]: generateExampleController(isTs),
    [`example.routes.${ext}`]: generateExampleRoutes(config),
  };
}

function generateExampleModel(isTs) {
  if (isTs) {
    return `import mongoose, { Document } from 'mongoose';

export interface IExample extends Document {
  title: string;
  description: string;
  isActive: boolean;
}

const exampleSchema = new mongoose.Schema<IExample>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

exampleSchema.index({ title: 'text' });

export default mongoose.model<IExample>('Example', exampleSchema);
`;
  }

  return `import mongoose from 'mongoose';

/**
 * Example model — rename/copy this for your own domain entities.
 */
const exampleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

exampleSchema.index({ title: 'text' });

export default mongoose.model('Example', exampleSchema);
`;
}

function generateExampleValidation(isTs) {
  return `import Joi from 'joi';

export const createExampleSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  description: Joi.string().trim().allow('').optional(),
});

export const updateExampleSchema = Joi.object({
  title: Joi.string().trim().max(200).optional(),
  description: Joi.string().trim().allow('').optional(),
  isActive: Joi.boolean().optional(),
});
`;
}

function generateExampleService(isTs) {
  return `import createError from 'http-errors';
import Example from '@/models/example.model.js';
import { paginate, paginatedResponse } from '@/utils/paginate.js';

/** List examples with pagination. */
export const listExamples = async (query${isTs ? ': { page?: string; limit?: string }' : ''} = {}) => {
  const { page, limit, skip } = paginate(query);
  const [items, total] = await Promise.all([
    Example.find({ isActive: true }).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Example.countDocuments({ isActive: true }),
  ]);
  return paginatedResponse(items, total, page, limit);
};

/** Get a single example by ID. */
export const getExampleById = async (id${isTs ? ': string' : ''}) => {
  const item = await Example.findById(id);
  if (!item) throw createError(404, 'EXAMPLE_NOT_FOUND');
  return { item };
};

/** Create a new example. */
export const createExample = async (data${isTs ? ': { title: string; description?: string }' : ''}) => {
  const item = await Example.create(data);
  return { item };
};

/** Update an existing example. */
export const updateExample = async (
  id${isTs ? ': string' : ''},
  data${isTs ? ': Partial<{ title: string; description: string; isActive: boolean }>' : ''}
) => {
  const item = await Example.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  if (!item) throw createError(404, 'EXAMPLE_NOT_FOUND');
  return { item };
};

/** Delete an example (hard delete — swap for soft delete if needed). */
export const deleteExample = async (id${isTs ? ': string' : ''}) => {
  const item = await Example.findByIdAndDelete(id);
  if (!item) throw createError(404, 'EXAMPLE_NOT_FOUND');
  return { message: 'DELETED' };
};
`;
}

function generateExampleController(isTs) {
  const req = isTs ? 'req: any, res: any' : 'req, res';

  return `import * as exampleService from './example.service.js';

// Plain async functions.
// The route loader automatically wraps all async handlers — no manual wrapping needed.

export const list = async (${req}) => {
  const response = await exampleService.listExamples(req.query);
  res.status(200).json(response);
};

export const getOne = async (${req}) => {
  const response = await exampleService.getExampleById(req.params.id);
  res.status(200).json(response);
};

export const create = async (${req}) => {
  const response = await exampleService.createExample(req.body);
  res.status(201).json(response);
};

export const update = async (${req}) => {
  const response = await exampleService.updateExample(req.params.id, req.body);
  res.status(200).json(response);
};

export const remove = async (${req}) => {
  const response = await exampleService.deleteExample(req.params.id);
  res.status(200).json(response);
};
`;
}

function generateExampleRoutes(config) {
  const { language, includeAuth } = config;

  const authImport = includeAuth
    ? `import { isAuthenticated } from '@/middlewares/auth.middleware.js';`
    : '';

  const authMiddleware = includeAuth ? 'isAuthenticated, ' : '';

  return `import express from 'express';
import * as ctrl from './example.controller.js';
import { createExampleSchema, updateExampleSchema } from './example.validation.js';
import { validateBody } from '@/middlewares/validation.middleware.js';
${authImport}

const router = express.Router();

// @doc List examples
router.get('/',    ctrl.list);
// @doc Get example by ID
router.get('/:id', ctrl.getOne);
// @doc Create example | 201
router.post(  '/',    ${authMiddleware}validateBody(createExampleSchema), ctrl.create);
// @doc Update example
router.put(   '/:id', ${authMiddleware}validateBody(updateExampleSchema), ctrl.update);
// @doc Delete example
router.delete('/:id', ${authMiddleware}ctrl.remove);

export default router;
`;
}
