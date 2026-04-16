import { createHttpError } from './http.js';

export function validate(schema, value) {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw createHttpError(400, 'Validation failed', result.error.flatten());
  }

  return result.data;
}
