import fs from 'node:fs';
import path from 'node:path';
import PptxGenJS from 'pptxgenjs';

const OUTPUT_DIR = path.join(process.cwd(), 'docs');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'Academic_Certificate_Verification_Presentation.pptx');
const SLIDE_W = 13.333;
const SLIDE_H = 7.5;

const COLORS = {
  navy: '0B1426',
  navySoft: '13203A',
  canvas: 'F7F9FC',
  white: 'FFFFFF',
  text: '1F2937',
  muted: '667085',
  border: 'D8E0EA',
  gold: 'C9A84C',
  goldSoft: 'FFF7E1',
  teal: '0F9D8A',
  tealSoft: 'E8FBF8',
  blue: '1D4ED8',
  blueSoft: 'EAF1FF',
  rose: 'B42318',
  roseSoft: 'FEF3F2',
  slate: '475467',
};

const FONTS = {
  heading: 'Aptos Display',
  body: 'Aptos',
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'OpenAI Codex';
pptx.company = 'Academic Certificate Verification Portal';
pptx.subject = 'Final year project presentation';
pptx.title = 'Blockchain-Based Academic Certificate Issuance and AI-Powered Forgery Detection';

function addBackground(slide, color = COLORS.canvas) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    line: { color },
    fill: { color },
  });
}

function addTopBand(slide, color = COLORS.gold) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: 0.15,
    line: { color },
    fill: { color },
  });
}

function addFooter(slide, pageNumber, dark = false) {
  const footerColor = dark ? 'C9D3E3' : COLORS.muted;

  slide.addText('Academic Certificate Verification Portal', {
    x: 0.55,
    y: 7.02,
    w: 4.8,
    h: 0.22,
    fontFace: FONTS.body,
    fontSize: 9,
    color: footerColor,
    margin: 0,
  });

  slide.addText(String(pageNumber).padStart(2, '0'), {
    x: 12.1,
    y: 6.98,
    w: 0.6,
    h: 0.22,
    fontFace: FONTS.body,
    fontSize: 10,
    bold: true,
    color: footerColor,
    align: 'right',
    margin: 0,
  });
}

function addHeader(slide, pageNumber, title, subtitle, sectionLabel = 'PROJECT OVERVIEW') {
  addBackground(slide);
  addTopBand(slide);

  slide.addText(title, {
    x: 0.58,
    y: 0.45,
    w: 8.8,
    h: 0.4,
    fontFace: FONTS.heading,
    fontSize: 24,
    bold: true,
    color: COLORS.navy,
    margin: 0,
  });

  slide.addText(subtitle, {
    x: 0.58,
    y: 0.92,
    w: 8.9,
    h: 0.3,
    fontFace: FONTS.body,
    fontSize: 10.5,
    color: COLORS.muted,
    margin: 0,
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 10.45,
    y: 0.42,
    w: 2.15,
    h: 0.4,
    rectRadius: 0.05,
    line: { color: COLORS.gold },
    fill: { color: COLORS.goldSoft },
  });

  slide.addText(sectionLabel, {
    x: 10.56,
    y: 0.51,
    w: 1.95,
    h: 0.16,
    fontFace: FONTS.body,
    fontSize: 9,
    bold: true,
    color: COLORS.gold,
    align: 'center',
    margin: 0,
  });

  addFooter(slide, pageNumber, false);
}

function addBulletPoints(slide, items, x, y, w, options = {}) {
  const fontSize = options.fontSize ?? 17;
  const lineHeight = options.lineHeight ?? 0.55;
  const bulletColor = options.bulletColor ?? COLORS.gold;
  const textColor = options.textColor ?? COLORS.text;
  const itemHeight = options.itemHeight ?? 0.42;
  let cursorY = y;

  items.forEach((item) => {
    slide.addShape(pptx.ShapeType.ellipse, {
      x,
      y: cursorY + 0.12,
      w: 0.1,
      h: 0.1,
      line: { color: bulletColor },
      fill: { color: bulletColor },
    });

    slide.addText(item, {
      x: x + 0.18,
      y: cursorY,
      w: w - 0.18,
      h: itemHeight,
      fontFace: FONTS.body,
      fontSize,
      color: textColor,
      margin: 0,
    });

    cursorY += lineHeight;
  });
}

function addCard(slide, { x, y, w, h, title, body, accent = COLORS.blue, fill = COLORS.white, titleColor, bodyColor }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.06,
    line: { color: COLORS.border, width: 1 },
    fill: { color: fill },
  });

  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 0.08,
    h,
    line: { color: accent },
    fill: { color: accent },
  });

  slide.addText(title, {
    x: x + 0.18,
    y: y + 0.16,
    w: w - 0.28,
    h: 0.3,
    fontFace: FONTS.body,
    fontSize: 13,
    bold: true,
    color: titleColor ?? COLORS.navy,
    margin: 0,
  });

  slide.addText(body, {
    x: x + 0.18,
    y: y + 0.5,
    w: w - 0.28,
    h: h - 0.62,
    fontFace: FONTS.body,
    fontSize: 10.5,
    color: bodyColor ?? COLORS.slate,
    margin: 0,
    valign: 'mid',
  });
}

function addSoftPanel(slide, x, y, w, h, title, fill, accent) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.06,
    line: { color: accent, width: 1.2 },
    fill: { color: fill },
  });

  slide.addText(title, {
    x: x + 0.18,
    y: y + 0.16,
    w: w - 0.36,
    h: 0.22,
    fontFace: FONTS.body,
    fontSize: 11,
    bold: true,
    color: accent,
    margin: 0,
  });
}

function addArrow(slide, x, y, w, h = 0) {
  slide.addShape(pptx.ShapeType.line, {
    x,
    y,
    w,
    h,
    line: {
      color: COLORS.blue,
      width: 1.5,
      endArrowType: 'triangle',
    },
  });
}

function addCoverSlide() {
  const slide = pptx.addSlide();
  addBackground(slide, COLORS.navy);

  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.2,
    line: { color: COLORS.gold },
    fill: { color: COLORS.gold },
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 8.95,
    y: 0.7,
    w: 3.6,
    h: 5.8,
    rectRadius: 0.08,
    line: { color: COLORS.navySoft },
    fill: { color: COLORS.navySoft },
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 9.25,
    y: 1.05,
    w: 3.0,
    h: 1.2,
    rectRadius: 0.05,
    line: { color: COLORS.gold },
    fill: { color: COLORS.goldSoft },
  });

  slide.addText('Final Year Project Presentation', {
    x: 0.7,
    y: 0.9,
    w: 4.0,
    h: 0.24,
    fontFace: FONTS.body,
    fontSize: 11,
    bold: true,
    color: COLORS.gold,
    margin: 0,
  });

  slide.addText('Blockchain-Based Academic Certificate Issuance and AI-Powered Forgery Detection', {
    x: 0.7,
    y: 1.35,
    w: 7.2,
    h: 1.8,
    fontFace: FONTS.heading,
    fontSize: 26,
    bold: true,
    color: COLORS.white,
    margin: 0,
  });

  slide.addText('Academic Certificate Verification Portal', {
    x: 0.72,
    y: 3.45,
    w: 5.6,
    h: 0.35,
    fontFace: FONTS.body,
    fontSize: 17,
    color: 'D7E2F0',
    margin: 0,
  });

  slide.addText(
    'A secure end-to-end platform for certificate issuance, blockchain-backed verification, PDF generation, and CNN-supported forgery detection.',
    {
      x: 0.72,
      y: 4.02,
      w: 6.7,
      h: 0.95,
      fontFace: FONTS.body,
      fontSize: 13,
      color: 'C9D3E3',
      margin: 0,
    },
  );

  addCard(slide, {
    x: 9.25,
    y: 2.55,
    w: 3.0,
    h: 0.82,
    title: 'Technology Stack',
    body: 'React 18, Vite, Express 5, private ledger, PDF-Lib, Jimp, ConvNetJS, JWT authentication.',
    accent: COLORS.blue,
    fill: COLORS.white,
  });

  addCard(slide, {
    x: 9.25,
    y: 3.65,
    w: 3.0,
    h: 0.82,
    title: 'Core Value Proposition',
    body: 'Fast certificate issuance, immutable proof of origin, and automated screening of suspicious uploads.',
    accent: COLORS.teal,
    fill: COLORS.white,
  });

  addCard(slide, {
    x: 9.25,
    y: 4.75,
    w: 3.0,
    h: 0.82,
    title: 'Presentation Scope',
    body: 'Abstract, existing system, drawbacks, proposed system, architecture, modules, requirements, conclusion, and references.',
    accent: COLORS.gold,
    fill: COLORS.white,
  });

  slide.addText('Prepared for final project review and demonstration', {
    x: 0.72,
    y: 6.72,
    w: 5.2,
    h: 0.24,
    fontFace: FONTS.body,
    fontSize: 10,
    color: 'AAB7C8',
    margin: 0,
  });

  addFooter(slide, 1, true);
}

function addAbstractSlide() {
  const slide = pptx.addSlide();
  addHeader(slide, 2, 'Abstract', 'Project summary and academic motivation', 'ABSTRACT');

  slide.addText(
    'The project addresses the problem of insecure and time-consuming certificate verification by combining digital issuance, immutable record keeping, and AI-supported document screening in one integrated platform.',
    {
      x: 0.62,
      y: 1.45,
      w: 6.0,
      h: 1.05,
      fontFace: FONTS.body,
      fontSize: 15,
      color: COLORS.text,
      margin: 0,
    },
  );

  addBulletPoints(
    slide,
    [
      'Institutions issue certificates through a web portal and generate a verifiable PDF document for each student.',
      'A cryptographic fingerprint of each certificate is stored in a private blockchain ledger to provide traceability and integrity.',
      'Verifiers can validate a certificate by ID or upload an image for CNN-based forgery analysis with structural anomaly checks.',
      'The system reduces manual effort, speeds up verification, and improves trust among institutions, students, and recruiters.',
    ],
    0.72,
    2.75,
    6.0,
    { fontSize: 13, lineHeight: 0.72, itemHeight: 0.58 },
  );

  addCard(slide, {
    x: 7.2,
    y: 1.52,
    w: 5.45,
    h: 4.95,
    title: 'Key Deliverables',
    body: '1. Admin and student dashboards.\n2. JWT-authenticated backend API.\n3. PDF certificate generation.\n4. Private blockchain ledger with chained hashes.\n5. CNN-backed forgery detection pipeline.\n6. Verification logs and audit trail.',
    accent: COLORS.teal,
    fill: COLORS.white,
  });
}

function addExistingSystemSlide() {
  const slide = pptx.addSlide();
  addHeader(slide, 3, 'Existing System', 'Conventional certificate issuance and verification workflow', 'CURRENT LANDSCAPE');

  addBulletPoints(
    slide,
    [
      'Academic certificates are commonly issued as printed documents or static PDF files maintained by examination cells.',
      'Verification usually depends on manual email, phone, or office-based confirmation from institutional staff.',
      'Student records, issued files, and verification history are often stored in separate spreadsheets or disconnected systems.',
      'External verifiers rarely receive machine-verifiable proof that a certificate has not been altered after issuance.',
      'Forgery detection is mostly visual and human-dependent, with no automated screening mechanism.',
    ],
    0.72,
    1.65,
    6.0,
    { fontSize: 13, lineHeight: 0.72, itemHeight: 0.58, bulletColor: COLORS.blue },
  );

  addSoftPanel(slide, 7.35, 1.55, 5.0, 4.9, 'Typical Legacy Flow', COLORS.blueSoft, COLORS.blue);
  addCard(slide, {
    x: 7.6,
    y: 2.0,
    w: 4.5,
    h: 0.9,
    title: 'Step 1: Certificate Creation',
    body: 'Certificate is prepared in office software and printed or exported as a PDF.',
    accent: COLORS.blue,
    fill: COLORS.white,
  });
  addCard(slide, {
    x: 7.6,
    y: 3.05,
    w: 4.5,
    h: 0.9,
    title: 'Step 2: Student Sharing',
    body: 'Student shares scanned copy or PDF with employers, universities, or agencies.',
    accent: COLORS.gold,
    fill: COLORS.white,
  });
  addCard(slide, {
    x: 7.6,
    y: 4.1,
    w: 4.5,
    h: 0.9,
    title: 'Step 3: Manual Verification',
    body: 'Verifier contacts the institution and waits for human confirmation.',
    accent: COLORS.teal,
    fill: COLORS.white,
  });
  addCard(slide, {
    x: 7.6,
    y: 5.15,
    w: 4.5,
    h: 0.9,
    title: 'Step 4: Trust Gap',
    body: 'Any edit to name, grade, or signature is difficult to prove unless the original office record is available.',
    accent: COLORS.rose,
    fill: COLORS.white,
  });
}

function addDrawbacksSlide() {
  const slide = pptx.addSlide();
  addHeader(slide, 4, 'Drawbacks of the Existing System', 'Operational, security, and trust limitations', 'GAP ANALYSIS');

  addCard(slide, {
    x: 0.72,
    y: 1.55,
    w: 3.95,
    h: 1.02,
    title: 'Manual and Slow Verification',
    body: 'Verification requests depend on staff availability, official working hours, and email response cycles.',
    accent: COLORS.rose,
    fill: COLORS.roseSoft,
  });
  addCard(slide, {
    x: 4.88,
    y: 1.55,
    w: 3.95,
    h: 1.02,
    title: 'Easy Document Manipulation',
    body: 'Names, grades, seals, and signatures can be edited in image editors without an embedded authenticity check.',
    accent: COLORS.rose,
    fill: COLORS.roseSoft,
  });
  addCard(slide, {
    x: 9.05,
    y: 1.55,
    w: 3.55,
    h: 1.02,
    title: 'No Immutable Record',
    body: 'Traditional systems do not maintain a tamper-evident chain for issued certificate fingerprints.',
    accent: COLORS.rose,
    fill: COLORS.roseSoft,
  });

  addBulletPoints(
    slide,
    [
      'Lack of centralized audit logs makes it difficult to review who issued or verified a certificate.',
      'Distributed spreadsheets and offline files increase the risk of duplication and inconsistent records.',
      'Recruiters and external agencies cannot perform independent real-time verification.',
      'Manual checking does not scale well when institutions issue certificates in large volumes.',
      'Confidence in digital copies remains low because authenticity depends on trust rather than cryptographic evidence.',
    ],
    0.82,
    3.1,
    7.2,
    { fontSize: 13, lineHeight: 0.72, itemHeight: 0.56, bulletColor: COLORS.rose },
  );

  addSoftPanel(slide, 8.55, 3.0, 3.95, 2.65, 'Impact on Stakeholders', COLORS.goldSoft, COLORS.gold);
  addBulletPoints(
    slide,
    [
      'Institutions spend time on repetitive validation tasks.',
      'Students face delays while proving their credentials.',
      'Employers risk accepting forged or altered certificates.',
    ],
    8.78,
    3.55,
    3.45,
    { fontSize: 12.5, lineHeight: 0.66, itemHeight: 0.5, bulletColor: COLORS.gold },
  );
}

function addProposedSystemSlide() {
  const slide = pptx.addSlide();
  addHeader(slide, 5, 'Proposed System', 'Secure issuance, verification, and forgery screening platform', 'PROPOSED SOLUTION');

  addBulletPoints(
    slide,
    [
      'Provide a role-based web portal for administrators and students using a unified full-stack architecture.',
      'Generate a certificate PDF and compute a cryptographic document hash at the time of issuance.',
      'Store the hash in a private append-only blockchain ledger to preserve integrity and traceability.',
      'Allow verifiers to validate a certificate instantly using the certificate ID and the corresponding ledger record.',
      'Analyze uploaded certificate images with a CNN-assisted forgery detector enhanced by crop and edit-region heuristics.',
      'Maintain verification logs to support auditability, reporting, and institutional accountability.',
    ],
    0.72,
    1.58,
    7.0,
    { fontSize: 13, lineHeight: 0.7, itemHeight: 0.56, bulletColor: COLORS.teal },
  );

  addSoftPanel(slide, 8.2, 1.55, 4.35, 4.95, 'End-to-End Workflow', COLORS.tealSoft, COLORS.teal);

  const workflowSteps = [
    ['01', 'Admin creates student and certificate data'],
    ['02', 'System generates PDF and document fingerprint'],
    ['03', 'Private ledger stores the certificate block'],
    ['04', 'Student accesses and shares certificate ID'],
    ['05', 'Verifier checks by ID or uploads an image'],
  ];

  workflowSteps.forEach(([index, text], itemIndex) => {
    const y = 2.0 + itemIndex * 0.87;
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 8.48,
      y,
      w: 0.42,
      h: 0.42,
      line: { color: COLORS.teal },
      fill: { color: COLORS.white },
    });
    slide.addText(index, {
      x: 8.48,
      y: y + 0.1,
      w: 0.42,
      h: 0.16,
      fontFace: FONTS.body,
      fontSize: 10,
      bold: true,
      color: COLORS.teal,
      align: 'center',
      margin: 0,
    });
    slide.addText(text, {
      x: 9.02,
      y: y + 0.03,
      w: 3.15,
      h: 0.32,
      fontFace: FONTS.body,
      fontSize: 11.5,
      color: COLORS.text,
      margin: 0,
    });
  });
}

function addAdvantagesSlide() {
  const slide = pptx.addSlide();
  addHeader(slide, 6, 'Advantages of the Proposed System', 'Why the new model is stronger than the conventional process', 'BENEFITS');

  const cards = [
    ['Fast verification', 'Certificate status can be checked instantly without waiting for manual institutional confirmation.', COLORS.blue, COLORS.blueSoft],
    ['Tamper evidence', 'Any mismatch between the stored fingerprint and the presented document can be detected during validation.', COLORS.gold, COLORS.goldSoft],
    ['AI assistance', 'The CNN-based detector screens uploaded images for suspicious cropping, editing, and layout anomalies.', COLORS.teal, COLORS.tealSoft],
    ['Auditability', 'Verification logs and issuance records provide a transparent history for institutional review.', COLORS.blue, COLORS.blueSoft],
    ['Better trust', 'Students, recruiters, and external agencies can rely on a verifiable digital record rather than visual inspection alone.', COLORS.gold, COLORS.goldSoft],
    ['Scalable deployment', 'The project runs on a standard Node.js stack and can be extended with real databases or cloud infrastructure.', COLORS.teal, COLORS.tealSoft],
  ];

  cards.forEach(([title, body, accent, fill], index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    addCard(slide, {
      x: 0.72 + col * 4.17,
      y: 1.75 + row * 2.2,
      w: 3.8,
      h: 1.75,
      title,
      body,
      accent,
      fill,
    });
  });
}

function addArchitectureSlide() {
  const slide = pptx.addSlide();
  addHeader(slide, 7, 'System Architecture Diagram', 'Logical view of the implemented end-to-end platform', 'ARCHITECTURE');

  addCard(slide, {
    x: 0.55,
    y: 1.85,
    w: 2.15,
    h: 1.15,
    title: 'Stakeholders',
    body: 'Admin\nStudent\nExternal verifier',
    accent: COLORS.gold,
    fill: COLORS.white,
  });

  addCard(slide, {
    x: 3.05,
    y: 1.85,
    w: 2.25,
    h: 1.15,
    title: 'React Frontend',
    body: 'Login, dashboards,\nissuance forms, verification UI',
    accent: COLORS.blue,
    fill: COLORS.white,
  });

  addCard(slide, {
    x: 5.65,
    y: 1.65,
    w: 2.55,
    h: 1.55,
    title: 'Express Backend',
    body: 'Routing, JWT auth, validation,\nbusiness logic and service orchestration',
    accent: COLORS.teal,
    fill: COLORS.white,
  });

  addArrow(slide, 2.72, 2.42, 0.3);
  addArrow(slide, 5.33, 2.42, 0.28);

  const serviceBoxes = [
    [8.75, 1.0, 'JSON Data Store', 'Users, certificates,\nverification logs'],
    [8.75, 2.25, 'Private Blockchain Ledger', 'Hash-chained blocks,\ntransaction fingerprints'],
    [8.75, 3.5, 'PDF Generation & Storage', 'Certificate rendering,\ndownloadable PDF copies'],
    [8.75, 4.75, 'AI Forgery Detection Engine', 'CNN classifier,\nimage heuristics and risk scoring'],
  ];

  serviceBoxes.forEach(([x, y, title, body], index) => {
    addCard(slide, {
      x,
      y,
      w: 3.7,
      h: 0.95,
      title,
      body,
      accent: index % 2 === 0 ? COLORS.blue : COLORS.gold,
      fill: COLORS.white,
    });
    addArrow(slide, 8.2, 2.42, 0.45, y + 0.45 - 2.42);
  });

  slide.addText(
    'Certificate issuance writes to the data store, PDF storage, and private ledger. Verification requests consult the ledger and AI engine before returning the final authenticity result.',
    {
      x: 0.72,
      y: 6.1,
      w: 12.0,
      h: 0.55,
      fontFace: FONTS.body,
      fontSize: 11.5,
      italic: true,
      color: COLORS.slate,
      margin: 0,
    },
  );
}

function addModulesOverviewSlide() {
  const slide = pptx.addSlide();
  addHeader(slide, 8, 'Proposed Modules', 'Functional decomposition of the implemented solution', 'MODULE DESIGN');

  const modules = [
    ['01. Presentation Layer', 'Login, admin dashboard, student dashboard, certificate views, and upload-based verification screens.'],
    ['02. Authentication and API Layer', 'JWT-based access control, request validation, role handling, and REST endpoints.'],
    ['03. Certificate Management', 'Student registration, certificate issuance, metadata storage, and verification count updates.'],
    ['04. PDF Document Generator', 'Creates downloadable certificate files with institutional details and verification metadata.'],
    ['05. Private Blockchain Ledger', 'Stores immutable certificate fingerprints in chained blocks with transaction identifiers.'],
    ['06. AI Verification and Audit', 'Runs CNN-supported forgery detection and stores verification logs for accountability.'],
  ];

  modules.forEach(([title, body], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    addCard(slide, {
      x: 0.72 + col * 6.25,
      y: 1.55 + row * 1.65,
      w: 5.65,
      h: 1.25,
      title,
      body,
      accent: row === 0 ? COLORS.blue : row === 1 ? COLORS.gold : COLORS.teal,
      fill: COLORS.white,
    });
  });
}

function addModuleExplanationPartOne() {
  const slide = pptx.addSlide();
  addHeader(slide, 9, 'Explanation of Proposed Modules - Part I', 'User interaction, API services, and issuance workflow', 'MODULE DETAILS');

  addCard(slide, {
    x: 0.72,
    y: 1.55,
    w: 12.0,
    h: 1.25,
    title: 'Presentation Layer',
    body: 'Built with React and Vite. It provides login, role-based navigation, student management, certificate issuance forms, certificate history views, and verification screens. This module ensures a clean user experience for administrators, students, and verifiers.',
    accent: COLORS.blue,
    fill: COLORS.blueSoft,
  });
  addCard(slide, {
    x: 0.72,
    y: 3.0,
    w: 12.0,
    h: 1.25,
    title: 'Authentication and API Layer',
    body: 'Implemented with Express, JWT, and validation utilities. It protects admin-only routes, manages sessions, validates requests, and exposes REST endpoints for students, certificates, verification, and system health.',
    accent: COLORS.gold,
    fill: COLORS.goldSoft,
  });
  addCard(slide, {
    x: 0.72,
    y: 4.45,
    w: 12.0,
    h: 1.55,
    title: 'Certificate Management and PDF Generation',
    body: 'This module issues certificate IDs, binds the certificate to a registered student, computes the document fingerprint, and generates a polished PDF with academic metadata, block number, and verification hash. It supports traceable digital issuance instead of isolated document files.',
    accent: COLORS.teal,
    fill: COLORS.tealSoft,
  });
}

function addModuleExplanationPartTwo() {
  const slide = pptx.addSlide();
  addHeader(slide, 10, 'Explanation of Proposed Modules - Part II', 'Ledger, AI analysis, and verification workflow', 'MODULE DETAILS');

  addCard(slide, {
    x: 0.72,
    y: 1.55,
    w: 12.0,
    h: 1.35,
    title: 'Private Blockchain Ledger',
    body: 'A permissioned append-only ledger stores the certificate payload hash, previous block hash, transaction ID, and block hash. This creates an immutable chain of issued credentials and enables integrity checking during verification.',
    accent: COLORS.gold,
    fill: COLORS.goldSoft,
  });
  addCard(slide, {
    x: 0.72,
    y: 3.1,
    w: 12.0,
    h: 1.55,
    title: 'AI Forgery Detection Engine',
    body: 'The AI layer uses a lightweight binary CNN classifier implemented in ConvNetJS. It is trained on synthetic authentic and forged certificate-like samples. The detector is strengthened with border checks, crop detection, row anomaly analysis, tile outlier scoring, and edit-band scoring for suspicious text replacement.',
    accent: COLORS.teal,
    fill: COLORS.tealSoft,
  });
  addCard(slide, {
    x: 0.72,
    y: 4.9,
    w: 12.0,
    h: 1.1,
    title: 'Verification and Audit Logging',
    body: 'Verification by certificate ID checks the stored ledger record, while image upload verification checks the AI engine. Every verification event is logged with timestamp, mode, confidence, and result for auditability.',
    accent: COLORS.blue,
    fill: COLORS.blueSoft,
  });
}

function addRequirementsSlide() {
  const slide = pptx.addSlide();
  addHeader(slide, 11, 'Hardware and Software Requirements', 'Recommended environment for development and demonstration', 'DEPLOYMENT');

  addSoftPanel(slide, 0.72, 1.55, 5.8, 4.95, 'Hardware Requirements', COLORS.blueSoft, COLORS.blue);
  addBulletPoints(
    slide,
    [
      'Processor: Intel Core i5 / AMD Ryzen 5 or above recommended; dual-core minimum for basic execution.',
      'Memory: 8 GB RAM recommended; 4 GB minimum for classroom demonstration.',
      'Storage: Minimum 10 GB free disk space for project files, generated PDFs, models, and dependencies.',
      'Display: 1366 x 768 resolution or higher for comfortable dashboard usage and presentation display.',
      'Network: Internet access recommended for package installation and future deployment extensions.',
    ],
    0.95,
    2.05,
    5.25,
    { fontSize: 12.4, lineHeight: 0.72, itemHeight: 0.58, bulletColor: COLORS.blue },
  );

  addSoftPanel(slide, 6.82, 1.55, 5.8, 4.95, 'Software Requirements', COLORS.goldSoft, COLORS.gold);
  addBulletPoints(
    slide,
    [
      'Operating System: Windows 10/11, Linux, or macOS.',
      'Runtime: Node.js 20+ recommended; npm package manager.',
      'Frontend Stack: React 18, Vite 5, React Router, Axios.',
      'Backend Stack: Express 5, JWT, Multer, Zod, PDF-Lib, Jimp.',
      'AI Component: ConvNetJS-based CNN classifier with generated model file.',
      'Development Tools: VS Code or equivalent IDE, modern browser such as Chrome or Edge.',
    ],
    7.05,
    2.05,
    5.25,
    { fontSize: 12.4, lineHeight: 0.72, itemHeight: 0.58, bulletColor: COLORS.gold },
  );
}

function addConclusionSlide() {
  const slide = pptx.addSlide();
  addHeader(slide, 12, 'Conclusion', 'Project outcome and academic significance', 'CONCLUSION');

  slide.addText(
    'The proposed system successfully transforms certificate issuance from a manual trust-based process into a digital, traceable, and verifiable workflow.',
    {
      x: 0.72,
      y: 1.55,
      w: 11.7,
      h: 0.5,
      fontFace: FONTS.body,
      fontSize: 16,
      color: COLORS.text,
      bold: true,
      margin: 0,
    },
  );

  addBulletPoints(
    slide,
    [
      'The private blockchain ledger provides tamper-evident storage for certificate fingerprints and improves trust in issued records.',
      'The AI layer adds practical value by screening uploaded certificates for suspicious edits, cropping, and structural inconsistencies.',
      'The platform integrates administration, student access, PDF generation, verification, and audit logging in one deployable project.',
      'The solution is suitable for final-year academic demonstration and can be extended with a real dataset, cloud database, or enterprise deployment in future work.',
    ],
    0.82,
    2.35,
    7.25,
    { fontSize: 13.2, lineHeight: 0.76, itemHeight: 0.6, bulletColor: COLORS.teal },
  );

  addCard(slide, {
    x: 8.55,
    y: 2.2,
    w: 4.0,
    h: 3.2,
    title: 'Final Takeaway',
    body: 'A certificate becomes more trustworthy when issuance, storage, verification, and forgery screening are designed as one integrated pipeline rather than separate tasks.',
    accent: COLORS.teal,
    fill: COLORS.tealSoft,
  });
}

function addReferencesSlide() {
  const slide = pptx.addSlide();
  addHeader(slide, 13, 'References', 'Standards, frameworks, libraries, and project sources', 'REFERENCES');

  const references = [
    'React Documentation. React Team. https://react.dev/',
    'Express.js Documentation. OpenJS Foundation. https://expressjs.com/',
    'Karpathy, A. ConvNetJS: Deep Learning in JavaScript. https://cs.stanford.edu/people/karpathy/convnetjs/',
    'Jones, M., Bradley, J., and Sakimura, N. JSON Web Token (JWT), RFC 7519, IETF, 2015.',
    'PDF-Lib Documentation. https://pdf-lib.js.org/',
    'Jimp Documentation. https://jimp-dev.github.io/jimp/',
    'PptxGenJS Documentation. Brent Ely. https://gitbrent.github.io/PptxGenJS/',
    'Academic Certificate Verification Portal, project source code and generated technical artifacts, 2026.',
  ];

  addBulletPoints(slide, references, 0.82, 1.65, 11.8, {
    fontSize: 12.2,
    lineHeight: 0.66,
    itemHeight: 0.52,
    bulletColor: COLORS.blue,
  });
}

addCoverSlide();
addAbstractSlide();
addExistingSystemSlide();
addDrawbacksSlide();
addProposedSystemSlide();
addAdvantagesSlide();
addArchitectureSlide();
addModulesOverviewSlide();
addModuleExplanationPartOne();
addModuleExplanationPartTwo();
addRequirementsSlide();
addConclusionSlide();
addReferencesSlide();

await pptx.writeFile({ fileName: OUTPUT_FILE, compression: true });

console.log(`Presentation generated at: ${OUTPUT_FILE}`);
