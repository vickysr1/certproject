import assert from 'node:assert/strict'
import test from 'node:test'
import { appendCertificateBlock, ensureLedger, validateLedger } from '../services/blockchainLedger.js'

function createDraftDatabase() {
  return {
    blockchain: {
      chain: [],
    },
  }
}

test('appendCertificateBlock creates a valid chain entry', () => {
  const database = createDraftDatabase()
  const certificate = {
    id: 'CERT-TEST-0001',
    documentHash: '0xabc123',
    issuedAt: '2026-04-12T00:00:00.000Z',
  }

  ensureLedger(database)
  const block = appendCertificateBlock(database, certificate)
  const status = validateLedger(database.blockchain.chain)

  assert.equal(block.index, 1)
  assert.equal(block.certificateId, certificate.id)
  assert.equal(status.valid, true)
  assert.equal(status.transactionCount, 1)
})

test('validateLedger reports tampering when a block is modified', () => {
  const database = createDraftDatabase()
  const certificate = {
    id: 'CERT-TEST-0002',
    documentHash: '0xfeedbeef',
    issuedAt: '2026-04-12T01:00:00.000Z',
  }

  ensureLedger(database)
  appendCertificateBlock(database, certificate)
  database.blockchain.chain[1].payloadHash = '0xdeadbeef'

  const status = validateLedger(database.blockchain.chain)

  assert.equal(status.valid, false)
  assert.ok(status.issues.some(issue => issue.includes('Block hash mismatch')))
})
