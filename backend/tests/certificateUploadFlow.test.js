import assert from 'node:assert/strict';
import test from 'node:test';
import { PDFDocument } from 'pdf-lib';
import { getDatabaseSnapshot, updateDatabase } from '../lib/database.js';
import { uploadCertificate, deleteCertificate } from '../services/certificateService.js';
import { verifyUploadedCertificate } from '../services/verificationService.js';
import { initializeDatabase } from '../lib/database.js';

test('certificate upload and validation flow', async () => {
  // Ensure the database is initialized
  await initializeDatabase();

  const mockIssuer = {
    id: 'admin',
    name: 'Administrator',
  };

  const payload = {
    studentId: 'student01',
    degree: 'Bachelor of Science',
    branch: 'Physics',
    institution: 'National Institute of Technology',
    year: '2025',
    grade: 'First Class',
  };

  // Mock certificate file (a very basic PDF)
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([600, 400]);
  const mockPdfBytes = await pdfDoc.save();

  const mockFile = {
    buffer: Buffer.from(mockPdfBytes),
    originalname: 'original_physics_cert.pdf',
    mimetype: 'application/pdf',
  };

  // 1. Upload certificate
  const certificate = await uploadCertificate(payload, mockFile, mockIssuer);

  assert.ok(certificate.id);
  assert.equal(certificate.studentId, 'student01');
  assert.equal(certificate.degree, 'Bachelor of Science');
  assert.ok(certificate.blockchainHash);
  assert.ok(certificate.blockNumber > 0);

  // Retrieve document base64 from database and parse it
  const db = getDatabaseSnapshot();
  const dbCert = db.certificates.find(c => c.id === certificate.id);
  assert.ok(dbCert);
  assert.ok(dbCert.documentBase64);

  // Ensure that the generated PDF does not contain the literal text "Blockchain Block"
  // (We check the raw saved bytes as standard pdf-lib text drawing isn't compressed by default)
  const decodedPdfBytes = Buffer.from(dbCert.documentBase64, 'base64');
  const pdfTextContent = decodedPdfBytes.toString('utf-8');
  assert.ok(!pdfTextContent.includes('Blockchain Block'), 'PDF must not display the blockchain block number');

  // 2. Verify the uploaded certificate via binary fingerprint match
  const uploadVerificationFile = {
    buffer: decodedPdfBytes,
    originalname: `CERT_UPLOADED_${certificate.id}.pdf`,
    mimetype: 'application/pdf',
  };

  const verificationResult = await verifyUploadedCertificate(uploadVerificationFile);
  assert.equal(verificationResult.analysisType, 'pdf-fingerprint');
  assert.equal(verificationResult.aiResult.authentic, true);
  assert.equal(verificationResult.matchedCertificate.id, certificate.id);

  // 3. Clean up the certificate from the database to restore state
  await deleteCertificate(certificate.id);
});
