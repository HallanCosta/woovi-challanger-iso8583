import { randomBytes } from 'node:crypto';

// Generate a 128-bit positive integer for TigerBeetle IDs.
export const newId = (): bigint => {
  const bytes = randomBytes(16);
  bytes[0] &= 0x7f; // keep positive
  return BigInt('0x' + bytes.toString('hex'));
};

export const fromNumber = (n: number): bigint => BigInt(n);
