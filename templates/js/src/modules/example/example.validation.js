import Joi from 'joi';

export const createExampleSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  description: Joi.string().trim().allow('').optional(),
});

export const updateExampleSchema = Joi.object({
  title: Joi.string().trim().max(200).optional(),
  description: Joi.string().trim().allow('').optional(),
  isActive: Joi.boolean().optional(),
});
