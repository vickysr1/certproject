import { getDatabaseSnapshot } from '../lib/database.js';
import { issueCertificate } from './certificateService.js';
import { ensureBaselineModel, getClassifierSummary } from './ai/cnnClassifier.js';

export async function bootstrapApplicationData() {
  await ensureBaselineModel();

  const snapshot = getDatabaseSnapshot();

  if (!snapshot.certificates.length) {
    await issueCertificate(
      {
        studentId: 'student01',
        degree: 'Bachelor of Engineering',
        branch: 'Computer Science',
        institution: 'National Institute of Technology',
        year: '2024',
        grade: 'First Class with Distinction',
      },
      { id: 'admin', name: 'Administrator' },
    );

    await issueCertificate(
      {
        studentId: 'student02',
        degree: 'Master of Technology',
        branch: 'Data Science',
        institution: 'National Institute of Technology',
        year: '2024',
        grade: 'First Class',
      },
      { id: 'admin', name: 'Administrator' },
    );
  }

  return {
    certificates: getDatabaseSnapshot().certificates.length,
    classifier: await getClassifierSummary(),
  };
}
