import fs from 'node:fs/promises';
import bcryptjs from 'bcryptjs';
import { MongoClient } from 'mongodb';
import { google } from 'googleapis';
import { config } from '../config.js';

const { hashSync } = bcryptjs;

let database = null;
let writeQueue = Promise.resolve();

// MongoDB state
let mongoCollection = null;
const MONGO_DOC_ID = 'main';

// Google Sheets state
let sheetsClient = null;
let sheetsSpreadsheetId = null;

// Sheet names for each collection
const SHEETS = {
  users: 'Users',
  certificates: 'Certificates',
  documents: 'Documents',
  blockchainMeta: 'BlockchainMeta',
  blockchainChain: 'BlockchainChain',
  verificationLogs: 'VerificationLogs',
  counters: 'Counters',
};

// ─── Seed data ────────────────────────────────────────────────────────────────

function createSeedUsers() {
  const createdAt = new Date().toISOString();

  return [
    {
      id: 'admin',
      passwordHash: hashSync('admin123', 10),
      role: 'admin',
      status: 'active',
      name: 'Administrator',
      email: 'admin@university.edu',
      department: 'Examinations Cell',
      createdAt,
    },
    {
      id: 'student01',
      passwordHash: hashSync('student123', 10),
      role: 'student',
      status: 'active',
      name: 'Arjun Sharma',
      email: 'arjun@student.edu',
      department: 'Computer Science',
      batch: '2020-2024',
      rollNumber: 'CSE2024001',
      createdAt,
    },
    {
      id: 'student02',
      passwordHash: hashSync('student123', 10),
      role: 'student',
      status: 'active',
      name: 'Priya Menon',
      email: 'priya@student.edu',
      department: 'Data Science',
      batch: '2020-2024',
      rollNumber: 'DS2024002',
      createdAt,
    },
  ];
}

function createDefaultState() {
  return {
    users: createSeedUsers(),
    certificates: [],
    verificationLogs: [],
    blockchain: {
      network: 'cert-portal-private-ledger',
      validator: 'CertPortal-Ledger-Node-1',
      chain: [],
      lastValidatedAt: null,
    },
    counters: {
      studentSequence: 2,
      certificateSequence: 0,
    },
  };
}

// ─── Write helpers ─────────────────────────────────────────────────────────────

async function writeDatabaseMongo(nextDatabase) {
  database = nextDatabase;
  await mongoCollection.replaceOne(
    { _id: MONGO_DOC_ID },
    { _id: MONGO_DOC_ID, ...nextDatabase },
    { upsert: true },
  );
}

async function writeDatabaseFile(nextDatabase) {
  database = nextDatabase;
  try {
    await fs.writeFile(config.databasePath, JSON.stringify(nextDatabase, null, 2));
  } catch (err) {
    console.error(`[database] Failed to persist to ${config.databasePath}:`, err);
    throw err;
  }
}

// ─── Google Sheets helpers ────────────────────────────────────────────────────

async function ensureSheets() {
  const spreadsheet = await sheetsClient.spreadsheets.get({ spreadsheetId: sheetsSpreadsheetId });
  const existingTitles = spreadsheet.data.sheets.map((s) => s.properties.title);
  const needed = Object.values(SHEETS).filter((title) => !existingTitles.includes(title));

  if (needed.length > 0) {
    await sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId: sheetsSpreadsheetId,
      requestBody: {
        requests: needed.map((title) => ({ addSheet: { properties: { title } } })),
      },
    });
    console.log(`[sheets] Created sheets: ${needed.join(', ')}`);
  }
}

async function readSheet(sheetName) {
  try {
    const res = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: sheetsSpreadsheetId,
      range: `${sheetName}!A:B`,
    });
    return res.data.values || [];
  } catch {
    return [];
  }
}

async function clearAndWriteSheet(sheetName, rows) {
  await sheetsClient.spreadsheets.values.clear({
    spreadsheetId: sheetsSpreadsheetId,
    range: `${sheetName}!A:Z`,
  });

  if (rows.length > 0) {
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId: sheetsSpreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: rows },
    });
  }
}

async function readFromSheets() {
  const [usersRows, certsRows, docsRows, metaRows, chainRows, logsRows, countersRows] = await Promise.all([
    readSheet(SHEETS.users),
    readSheet(SHEETS.certificates),
    readSheet(SHEETS.documents),
    readSheet(SHEETS.blockchainMeta),
    readSheet(SHEETS.blockchainChain),
    readSheet(SHEETS.verificationLogs),
    readSheet(SHEETS.counters),
  ]);

  if (usersRows.length === 0 && certsRows.length === 0) {
    return null; // No data yet
  }

  // Build documents map for merging base64 back into certs
  const docsMap = {};
  for (const [certId, base64] of docsRows) {
    if (certId) docsMap[certId] = base64;
  }

  const users = usersRows.map(([json]) => JSON.parse(json));
  const certificates = certsRows.map(([json]) => {
    const cert = JSON.parse(json);
    if (docsMap[cert.id]) cert.documentBase64 = docsMap[cert.id];
    return cert;
  });
  const verificationLogs = logsRows.map(([json]) => JSON.parse(json));
  const blockchainChain = chainRows.map(([json]) => JSON.parse(json));
  const blockchainMeta = metaRows[0] ? JSON.parse(metaRows[0][0]) : { network: 'cert-portal-private-ledger', validator: 'CertPortal-Ledger-Node-1', lastValidatedAt: null };
  const counters = countersRows[0] ? JSON.parse(countersRows[0][0]) : { studentSequence: 0, certificateSequence: 0 };

  return {
    users,
    certificates,
    verificationLogs,
    blockchain: { ...blockchainMeta, chain: blockchainChain },
    counters,
  };
}

async function writeDatabaseSheets(nextDatabase) {
  database = nextDatabase;

  // Split documentBase64 out of certs into Documents sheet
  const certRows = nextDatabase.certificates.map((cert) => {
    const { documentBase64, ...rest } = cert;
    return [JSON.stringify(rest)];
  });

  const docRows = nextDatabase.certificates
    .filter((cert) => cert.documentBase64)
    .map((cert) => [cert.id, cert.documentBase64]);

  const { chain, ...blockchainMeta } = nextDatabase.blockchain;

  await Promise.all([
    clearAndWriteSheet(SHEETS.users, nextDatabase.users.map((u) => [JSON.stringify(u)])),
    clearAndWriteSheet(SHEETS.certificates, certRows),
    clearAndWriteSheet(SHEETS.documents, docRows),
    clearAndWriteSheet(SHEETS.blockchainMeta, [[JSON.stringify(blockchainMeta)]]),
    clearAndWriteSheet(SHEETS.blockchainChain, chain.map((b) => [JSON.stringify(b)])),
    clearAndWriteSheet(SHEETS.verificationLogs, nextDatabase.verificationLogs.map((l) => [JSON.stringify(l)])),
    clearAndWriteSheet(SHEETS.counters, [[JSON.stringify(nextDatabase.counters)]]),
  ]);
}

function writeDatabase(nextDatabase) {
  if (sheetsClient) return writeDatabaseSheets(nextDatabase);
  return mongoCollection ? writeDatabaseMongo(nextDatabase) : writeDatabaseFile(nextDatabase);
}

// ─── Init ──────────────────────────────────────────────────────────────────────

function ensureInitialized() {
  if (!database) {
    throw new Error('Database has not been initialized yet');
  }
}

async function initMongo(uri) {
  console.log('[database] Connecting to MongoDB…');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  mongoCollection = db.collection('state');

  const existing = await mongoCollection.findOne({ _id: MONGO_DOC_ID });
  if (existing) {
    const { _id, ...data } = existing;
    database = data;
    console.log('[database] Loaded state from MongoDB');
  } else {
    console.log('[database] No existing MongoDB state — seeding defaults');
    await writeDatabaseMongo(createDefaultState());
  }
}

async function initGoogleSheets(spreadsheetId, serviceAccountJson) {
  console.log('[database] Connecting to Google Sheets…');
  const credentials = JSON.parse(serviceAccountJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  sheetsClient = google.sheets({ version: 'v4', auth: await auth.getClient() });
  sheetsSpreadsheetId = spreadsheetId;

  await ensureSheets();

  const existing = await readFromSheets();
  if (existing) {
    database = existing;
    console.log('[database] Loaded state from Google Sheets');
  } else {
    console.log('[database] No existing Sheets data — seeding defaults');
    await writeDatabaseSheets(createDefaultState());
  }
}

async function initFile() {
  console.log(`[database] Initializing from ${config.databasePath}`);
  try {
    const raw = await fs.readFile(config.databasePath, 'utf8');
    database = JSON.parse(raw);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await writeDatabaseFile(createDefaultState());
  }
}

export async function initializeDatabase() {
  if (config.googleSheetsId && config.googleServiceAccount) {
    await initGoogleSheets(config.googleSheetsId, config.googleServiceAccount);
  } else if (config.databaseUrl) {
    await initMongo(config.databaseUrl);
  } else {
    await initFile();
  }
  return getDatabaseSnapshot();
}

// ─── Public API (unchanged) ───────────────────────────────────────────────────

export function getDatabase() {
  ensureInitialized();
  return database;
}

export function getDatabaseSnapshot() {
  ensureInitialized();
  return structuredClone(database);
}

export function updateDatabase(mutator) {
  ensureInitialized();

  const run = writeQueue.then(async () => {
    const draft = structuredClone(database);
    let result;
    try {
      result = await mutator(draft);
    } catch (err) {
      console.error('[database] Mutator error:', err);
      throw err;
    }
    try {
      await writeDatabase(draft);
    } catch (err) {
      console.error('[database] Persistence error:', err);
      throw err;
    }
    return result;
  });

  writeQueue = run.catch((err) => {
    console.error('[database] Queue error:', err);
  });
  return run;
}
