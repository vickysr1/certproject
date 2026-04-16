import { config } from '../config.js';
import { sha256Hex } from '../lib/hash.js';

const GENESIS_PREVIOUS_HASH = `0x${'0'.repeat(64)}`;

function blockFingerprint(block) {
  return {
    index: block.index,
    timestamp: block.timestamp,
    previousHash: block.previousHash,
    transactionId: block.transactionId,
    certificateId: block.certificateId,
    payloadHash: block.payloadHash,
    validator: block.validator,
  };
}

function computeBlockHash(block) {
  return sha256Hex(blockFingerprint(block));
}

export function createGenesisBlock() {
  const block = {
    index: 0,
    timestamp: '2026-01-01T00:00:00.000Z',
    previousHash: GENESIS_PREVIOUS_HASH,
    transactionId: 'GENESIS',
    certificateId: 'GENESIS',
    payloadHash: sha256Hex(`${config.appName}:genesis-block`),
    validator: config.blockchain.validator,
  };

  return {
    ...block,
    hash: computeBlockHash(block),
  };
}

export function ensureLedger(database) {
  if (!database.blockchain.chain.length) {
    database.blockchain.chain.push(createGenesisBlock());
  }

  return database.blockchain.chain;
}

export function appendCertificateBlock(database, certificate) {
  const chain = ensureLedger(database);
  const previousBlock = chain.at(-1);

  const block = {
    index: chain.length,
    timestamp: certificate.issuedAt,
    previousHash: previousBlock.hash,
    transactionId: sha256Hex(`${certificate.id}:${certificate.documentHash}:${certificate.issuedAt}`),
    certificateId: certificate.id,
    payloadHash: certificate.documentHash,
    validator: config.blockchain.validator,
  };

  const completeBlock = {
    ...block,
    hash: computeBlockHash(block),
  };

  chain.push(completeBlock);
  return completeBlock;
}

export function findLedgerBlock(chain, certificateId) {
  return chain.find((block) => block.certificateId === certificateId) || null;
}

export function validateLedger(chain) {
  const issues = [];

  if (!chain.length) {
    return {
      valid: false,
      issues: ['Ledger is empty'],
      blockCount: 0,
      transactionCount: 0,
      network: config.blockchain.network,
      validator: config.blockchain.validator,
      lastBlock: null,
    };
  }

  const genesis = chain[0];

  if (genesis.previousHash !== GENESIS_PREVIOUS_HASH) {
    issues.push('Genesis block previous hash is invalid');
  }

  if (genesis.hash !== computeBlockHash(genesis)) {
    issues.push('Genesis block hash mismatch detected');
  }

  for (let index = 1; index < chain.length; index += 1) {
    const current = chain[index];
    const previous = chain[index - 1];

    if (current.previousHash !== previous.hash) {
      issues.push(`Chain link mismatch at block ${current.index}`);
    }

    if (current.hash !== computeBlockHash(current)) {
      issues.push(`Block hash mismatch at block ${current.index}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    blockCount: chain.length,
    transactionCount: Math.max(chain.length - 1, 0),
    network: config.blockchain.network,
    validator: config.blockchain.validator,
    lastBlock: chain.at(-1) || null,
  };
}
