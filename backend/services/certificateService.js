import { getDatabaseSnapshot, updateDatabase } from '../lib/database.js';
import { createHttpError, sanitizeCertificate } from '../lib/http.js';
import { nextCertificateId } from '../lib/ids.js';
import { sha256Hex } from '../lib/hash.js';
import { appendCertificateBlock, ensureLedger } from './blockchainLedger.js';
import { generateCertificatePdf, embedQrCodeInUploadedFile } from './certificatePdfService.js';

function normalizeText(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function certificateHashPayload(certificate) {
  return {
    id: certificate.id,
    studentId: certificate.studentId,
    studentName: certificate.studentName,
    rollNumber: certificate.rollNumber,
    degree: certificate.degree,
    branch: certificate.branch,
    institution: certificate.institution,
    year: certificate.year,
    grade: certificate.grade,
    issuedAt: certificate.issuedAt,
    issuedBy: certificate.issuedBy,
    templateVersion: certificate.templateVersion,
  };
}

function buildDocumentHash(certificate) {
  return sha256Hex(certificateHashPayload(certificate));
}

export function listCertificates(filters = {}) {
  const { studentId } = filters;

  return getDatabaseSnapshot()
    .certificates
    .filter((certificate) => !studentId || certificate.studentId === studentId)
    .sort((left, right) => new Date(right.issuedAt) - new Date(left.issuedAt))
    .map(sanitizeCertificate);
}

export function getRawCertificate(certificateId) {
  return getDatabaseSnapshot().certificates.find((certificate) => certificate.id === certificateId) || null;
}

export function getCertificateDocument(certificateId) {
  const certificate = getRawCertificate(certificateId);

  if (!certificate) {
    throw createHttpError(404, 'Certificate not found');
  }

  if (!certificate.storagePath) {
    throw createHttpError(404, 'Certificate document is not available');
  }

  return certificate;
}

export async function issueCertificate(payload, issuer) {
  const issuedAt = new Date();

  return updateDatabase(async (database) => {
    ensureLedger(database);

    const student = database.users.find(
      (user) => user.id === payload.studentId && user.role === 'student' && user.status === 'active',
    );

    if (!student) {
      throw createHttpError(404, 'Active student account not found');
    }

    const certificate = {
      id: nextCertificateId(database, issuedAt),
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      department: student.department,
      batch: student.batch,
      rollNumber: student.rollNumber,
      degree: normalizeText(payload.degree),
      branch: normalizeText(payload.branch),
      institution: normalizeText(payload.institution),
      year: String(payload.year),
      grade: normalizeText(payload.grade),
      status: 'issued',
      issuedAt: issuedAt.toISOString(),
      issuedBy: issuer.id,
      issuedByName: issuer.name,
      templateVersion: '2026.1',
      verificationCount: 0,
    };

    certificate.documentHash = buildDocumentHash(certificate);

    const block = appendCertificateBlock(database, certificate);
    const pdf = await generateCertificatePdf(certificate, block);

    const storedCertificate = {
      ...certificate,
      blockchainHash: block.hash,
      blockNumber: block.index,
      transactionId: block.transactionId,
      storagePath: pdf.storagePath,
      documentFileName: pdf.fileName,
      documentSize: pdf.byteLength,
      documentFileHash: pdf.fileHash,
    };

    database.certificates.unshift(storedCertificate);
    database.counters.certificateSequence += 1;

    return sanitizeCertificate(storedCertificate);
  });
}

export async function uploadCertificate(payload, file, issuer) {
  const issuedAt = new Date();

  return updateDatabase(async (database) => {
    ensureLedger(database);

    const student = database.users.find(
      (user) => user.id === payload.studentId && user.role === 'student' && user.status === 'active',
    );

    if (!student) {
      throw createHttpError(404, 'Active student account not found');
    }

    const certificate = {
      id: nextCertificateId(database, issuedAt),
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      department: student.department,
      batch: student.batch,
      rollNumber: student.rollNumber,
      degree: normalizeText(payload.degree),
      branch: normalizeText(payload.branch),
      institution: normalizeText(payload.institution),
      year: String(payload.year),
      grade: normalizeText(payload.grade),
      status: 'issued',
      issuedAt: issuedAt.toISOString(),
      issuedBy: issuer.id,
      issuedByName: issuer.name,
      templateVersion: '2026.1-upload',
      verificationCount: 0,
    };

    certificate.documentHash = buildDocumentHash(certificate);

    const block = appendCertificateBlock(database, certificate);
    
    // Embed QR code into the uploaded file and save as PDF
    const pdf = await embedQrCodeInUploadedFile(file, certificate.id);

    const storedCertificate = {
      ...certificate,
      blockchainHash: block.hash,
      blockNumber: block.index,
      transactionId: block.transactionId,
      storagePath: pdf.storagePath,
      documentFileName: pdf.fileName,
      documentSize: pdf.byteLength,
      documentFileHash: pdf.fileHash,
    };

    database.certificates.unshift(storedCertificate);
    database.counters.certificateSequence += 1;

    return sanitizeCertificate(storedCertificate);
  });
}
