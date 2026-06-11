import createError from 'http-errors';

const validate = (target) => (schema) => (req, res, next) => {
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
