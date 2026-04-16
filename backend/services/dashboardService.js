import { getDatabaseSnapshot } from '../lib/database.js';
import { sanitizeCertificate } from '../lib/http.js';
import { validateLedger } from './blockchainLedger.js';

function compactVerificationLog(log) {
  return {
    id: log.id,
    mode: log.mode,
    certificateId: log.certificateId || null,
    fileName: log.fileName || null,
    authentic: log.authentic,
    valid: log.valid,
    confidence: log.confidence,
    requestedBy: log.requestedBy || 'anonymous',
    createdAt: log.createdAt,
  };
}

export function getAdminOverview() {
  const database = getDatabaseSnapshot();
  const students = database.users.filter((user) => user.role === 'student');
  const activeStudents = students.filter((user) => user.status === 'active');
  const ledger = validateLedger(database.blockchain.chain);

  return {
    metrics: {
      certificatesIssued: database.certificates.length,
      studentsTotal: students.length,
      studentsActive: activeStudents.length,
      verificationChecks: database.verificationLogs.length,
      chainHealthy: ledger.valid,
    },
    blockchain: ledger,
    recentCertificates: database.certificates.slice(0, 5).map(sanitizeCertificate),
    recentVerifications: database.verificationLogs.slice(0, 5).map(compactVerificationLog),
  };
}
