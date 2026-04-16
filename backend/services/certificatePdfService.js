import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import { config } from '../config.js';
import { sha256BytesHex } from '../lib/hash.js';

function drawCenteredText(page, text, y, font, size, color) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (page.getWidth() - width) / 2,
    y,
    font,
    size,
    color,
  });
}

async function generateQrCodeBuffer(text) {
  const dataUrl = await QRCode.toDataURL(text, {
    margin: 1,
    width: 200,
    errorCorrectionLevel: 'M',
  });
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

function wrapMonospaceText(text, lineLength) {
  const lines = [];

  for (let index = 0; index < text.length; index += lineLength) {
    lines.push(text.slice(index, index + lineLength));
  }

  return lines;
}

export async function generateCertificatePdf(certificate, block) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  const titleFont = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const headingFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
  const monoFont = await pdf.embedFont(StandardFonts.Courier);
  const { width, height } = page.getSize();

  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderWidth: 2.5,
    borderColor: rgb(0.74, 0.59, 0.18),
  });

  page.drawRectangle({
    x: 36,
    y: 36,
    width: width - 72,
    height: height - 72,
    borderWidth: 1,
    borderColor: rgb(0.84, 0.75, 0.4),
  });

  drawCenteredText(page, certificate.institution, height - 82, headingFont, 16, rgb(0.05, 0.14, 0.3));
  drawCenteredText(page, 'Academic Certificate of Completion', height - 132, titleFont, 28, rgb(0.07, 0.11, 0.22));
  drawCenteredText(page, 'Blockchain registered and digitally verifiable', height - 160, bodyFont, 12, rgb(0.25, 0.31, 0.44));

  page.drawText('This certifies that', {
    x: 90,
    y: height - 220,
    font: bodyFont,
    size: 16,
    color: rgb(0.18, 0.22, 0.3),
  });

  drawCenteredText(page, certificate.studentName, height - 258, titleFont, 24, rgb(0.12, 0.16, 0.27));

  drawCenteredText(
    page,
    `has successfully completed ${certificate.degree} in ${certificate.branch}`,
    height - 298,
    bodyFont,
    15,
    rgb(0.18, 0.22, 0.3),
  );

  drawCenteredText(
    page,
    `with ${certificate.grade} during the academic year ${certificate.year}`,
    height - 326,
    bodyFont,
    15,
    rgb(0.18, 0.22, 0.3),
  );

  page.drawRectangle({
    x: 90,
    y: 150,
    width: width - 180,
    height: 92,
    borderWidth: 1,
    borderColor: rgb(0.83, 0.86, 0.9),
    color: rgb(0.97, 0.98, 0.99),
  });

  const metadataRows = [
    ['Certificate ID', certificate.id],
    ['Student ID', certificate.studentId],
    ['Roll Number', certificate.rollNumber || 'N/A'],
    ['Issued On', new Date(certificate.issuedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Blockchain Block', String(block.index)],
    ['Transaction ID', block.transactionId.slice(0, 22)],
  ];

  metadataRows.forEach(([label, value], rowIndex) => {
    const x = rowIndex < 3 ? 112 : 442;
    const y = 212 - (rowIndex % 3) * 24;

    page.drawText(label, {
      x,
      y,
      font: headingFont,
      size: 10,
      color: rgb(0.25, 0.3, 0.39),
    });

    page.drawText(value, {
      x,
      y: y - 13,
      font: bodyFont,
      size: 10,
      color: rgb(0.12, 0.16, 0.27),
    });
  });

  page.drawText('Verifier Hash', {
    x: 90,
    y: 120,
    font: headingFont,
    size: 11,
    color: rgb(0.25, 0.3, 0.39),
  });

  wrapMonospaceText(certificate.documentHash, 54).forEach((line, index) => {
    page.drawText(line, {
      x: 90,
      y: 102 - index * 12,
      font: monoFont,
      size: 8.5,
      color: rgb(0.05, 0.18, 0.35),
    });
  });

  page.drawText('Authorized Issuer', {
    x: width - 230,
    y: 88,
    font: headingFont,
    size: 11,
    color: rgb(0.25, 0.3, 0.39),
  });

  page.drawLine({
    start: { x: width - 250, y: 78 },
    end: { x: width - 110, y: 78 },
    thickness: 1,
    color: rgb(0.1, 0.14, 0.24),
  });

  page.drawText(certificate.issuedByName, {
    x: width - 246,
    y: 58,
    font: bodyFont,
    size: 10,
    color: rgb(0.12, 0.16, 0.27),
  });

  // Embed QR Code
  const qrCodeUrl = `${config.publicUrl}/verify/${certificate.id}`;
  const qrCodeBuffer = await generateQrCodeBuffer(qrCodeUrl);
  const qrCodeImage = await pdf.embedPng(qrCodeBuffer);
  const qrSize = 80;
  page.drawImage(qrCodeImage, {
    x: width - qrSize - 40,
    y: 40,
    width: qrSize,
    height: qrSize,
  });

  const bytes = await pdf.save();
  const fileName = `${certificate.id}.pdf`;
  const storagePath = path.join(config.certificateStorageDir, fileName);

  await fs.writeFile(storagePath, bytes);

  return {
    fileName,
    storagePath,
    byteLength: bytes.length,
    fileHash: sha256BytesHex(bytes),
  };
}

export async function embedQrCodeInUploadedFile(file, certificateId) {
  const qrCodeUrl = `${config.publicUrl}/verify/${certificateId}`;
  const qrCodeBuffer = await generateQrCodeBuffer(qrCodeUrl);
  
  let pdf;
  const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    pdf = await PDFDocument.load(file.buffer);
  } else {
    // It's an image, create a new PDF and embed the image
    pdf = await PDFDocument.create();
    const image = file.mimetype.startsWith('image/png') 
      ? await pdf.embedPng(file.buffer) 
      : await pdf.embedJpg(file.buffer);
    
    const { width, height } = image.scale(0.5); // Initial scale
    const page = pdf.addPage([width + 100, height + 150]);
    page.drawImage(image, {
      x: 50,
      y: 100,
      width,
      height,
    });
  }

  const pages = pdf.getPages();
  const lastPage = pages[pages.length - 1];
  const { width } = lastPage.getSize();
  
  const qrCodeImage = await pdf.embedPng(qrCodeBuffer);
  const qrSize = 80;
  
  lastPage.drawImage(qrCodeImage, {
    x: width - qrSize - 20,
    y: 20,
    width: qrSize,
    height: qrSize,
  });

  const bytes = await pdf.save();
  const fileName = `${certificateId}.pdf`;
  const storagePath = path.join(config.certificateStorageDir, fileName);

  await fs.writeFile(storagePath, bytes);

  return {
    fileName,
    storagePath,
    byteLength: bytes.length,
    fileHash: sha256BytesHex(bytes),
  };
}
