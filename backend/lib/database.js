import fs from 'node:fs/promises';
import bcryptjs from 'bcryptjs';
import { config } from '../config.js';

const { hashSync } = bcryptjs;

let database = null;
let writeQueue = Promise.resolve();

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

async function writeDatabase(nextDatabase) {
  database = nextDatabase;
  await fs.writeFile(config.databasePath, JSON.stringify(nextDatabase, null, 2));
}

function ensureInitialized() {
  if (!database) {
    throw new Error('Database has not been initialized yet');
  }
}

export async function initializeDatabase() {
  try {
    const raw = await fs.readFile(config.databasePath, 'utf8');
    database = JSON.parse(raw);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    const seedState = createDefaultState();
    await writeDatabase(seedState);
  }

  return getDatabaseSnapshot();
}

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
    const result = await mutator(draft);
    await writeDatabase(draft);
    return result;
  });

  writeQueue = run.catch(() => {});
  return run;
}
