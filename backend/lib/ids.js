export function nextStudentId(database) {
  const next = database.counters.studentSequence + 1;
  return `student${String(next).padStart(2, '0')}`;
}

export function nextCertificateId(database, issuedAt = new Date()) {
  const next = database.counters.certificateSequence + 1;
  return `CERT-${issuedAt.getFullYear()}-${String(next).padStart(4, '0')}`;
}
