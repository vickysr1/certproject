import { createHash } from 'node:crypto';

function sortValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = sortValue(value[key]);
        return accumulator;
      }, {});
  }

  return value;
}

export function stableStringify(value) {
  return JSON.stringify(sortValue(value));
}

function isBinaryLike(value) {
  return Buffer.isBuffer(value) || value instanceof Uint8Array || value instanceof ArrayBuffer;
}

export function sha256(value) {
  const content = isBinaryLike(value)
    ? Buffer.from(value)
    : typeof value === 'string'
      ? value
      : stableStringify(value);
  return createHash('sha256').update(content).digest('hex');
}

export function sha256Hex(value) {
  return `0x${sha256(value)}`;
}

export function sha256Bytes(value) {
  return createHash('sha256').update(Buffer.from(value)).digest('hex');
}

export function sha256BytesHex(value) {
  return `0x${sha256Bytes(value)}`;
}
