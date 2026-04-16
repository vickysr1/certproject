import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { createHttpError, sanitizeUser } from '../lib/http.js';
import { getDatabase } from '../lib/database.js';

export function issueAuthToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      name: user.name,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

export function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next(createHttpError(401, 'Authentication token is required'));
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = getDatabase().users.find((entry) => entry.id === payload.sub);

    if (!user || user.status !== 'active') {
      throw createHttpError(401, 'Session is no longer valid');
    }

    req.user = sanitizeUser(user);
    return next();
  } catch (error) {
    return next(error.statusCode ? error : createHttpError(401, 'Invalid or expired session token'));
  }
}

export function requireRole(...roles) {
  return function authorize(req, _res, next) {
    if (!req.user) {
      return next(createHttpError(401, 'Authentication is required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(createHttpError(403, 'You do not have permission to perform this action'));
    }

    return next();
  };
}
