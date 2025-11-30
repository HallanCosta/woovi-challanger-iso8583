import { getIssuerConnection } from '../tcpConnectionManager.ts';
import { createIssuerNotFoundError } from '../errors.ts';
import type { Transaction } from '../types.ts';
import type { ConnectorResult } from './types.ts';

type Bank = 'hallan' | 'woovi';

const pickBank = (pan: string): Bank | null => {
  if (pan.startsWith('5162')) return 'hallan';
  if (pan.startsWith('2306')) return 'woovi';
  return null;
};

export const mastercardConnector = async (transaction: Transaction): Promise<ConnectorResult> => {
  const pan = transaction.cardNumber;
  const bank = pickBank(pan);

  if (!bank) {
    throw createIssuerNotFoundError('Issuer not found for this BIN', '15', 'mastercard', pan);
  }

  if (bank === 'woovi') {
    const message = `[ROUTING][MASTERCARD-WOOVI] PAN ${pan} routed to Woovi bank (no TCP issuer available)`;
    console.log(message);
    return { name: 'mastercard-woovi', noop: true, bank, message };
  }

  const socket = await getIssuerConnection();

  console.log(`[ROUTING][MASTERCARD-${bank.toUpperCase()}] Routing PAN ${pan} to ${bank} issuer`);

  return { name: `mastercard-${bank}`, socket };
};
