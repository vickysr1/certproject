import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

/**
 * Automatically detect local IP address for mobile testing on same network
 */
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();
const backendDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(backendDir);
// Support custom data directory (e.g., /tmp on Render for writable storage)
const dataDir = process.env.DATA_DIR ? path.join(process.env.DATA_DIR) : path.join(backendDir, 'data');
const storageDir = path.join(backendDir, 'storage');
console.log(`[config] Data directory: ${dataDir}`);
const certificateStorageDir = path.join(storageDir, 'certificates');
const uploadStorageDir = path.join(storageDir, 'uploads');
const modelDir = path.join(backendDir, 'models');
const tempDir = path.join(backendDir, 'tmp');

for (const dir of [dataDir, storageDir, certificateStorageDir, uploadStorageDir, modelDir, tempDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

export const config = {
  appName: 'Academic Certificate Verification Portal',
  port: Number(process.env.PORT || 5000),
  jwtSecret: process.env.JWT_SECRET || 'cert-portal-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  frontendUrl: process.env.FRONTEND_URL || `http://${localIp}:3000`,
  publicUrl: process.env.PUBLIC_URL || `http://${localIp}:3000`,
  databasePath: path.join(dataDir, 'database.json'),
  databaseUrl: process.env.DATABASE_URL,
  certificateStorageDir,
  uploadStorageDir,
  cnnModelPath: path.join(modelDir, 'certificate-cnn.json'),
  tempDir,
  blockchain: {
    network: 'cert-portal-private-ledger',
    validator: 'CertPortal-Ledger-Node-1',
  },
  ai: {
    inputSize: 64,
    baselineSamplesPerClass: 100,
    epochs: 7,
    expectedAspectRatio: 842 / 595,
    authenticThreshold: 44,
  },
};
