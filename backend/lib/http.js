export function createHttpError(statusCode, message, details) {
  const error = new Error(message);
  error.statusCode = statusCode;

  if (details) {
    error.details = details;
  }

  return error;
}

export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export function sanitizeCertificate(certificate) {
  if (!certificate) {
    return null;
  }

  const { storagePath, ...safeCertificate } = certificate;
  return {
    ...safeCertificate,
    documentAvailable: Boolean(certificate.storagePath),
  };
}
