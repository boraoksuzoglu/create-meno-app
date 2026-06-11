import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import Joi from 'joi';

type ValidateTarget = 'body' | 'query' | 'params';

const validate =
  (target: ValidateTarget) =>
  (schema: Joi.Schema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req[target]);
    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      throw createError(422, message);
    }
    next();
  };

export const validateBody = validate('body');
export const validateQuery = validate('query');
export const validateParams = validate('params');
