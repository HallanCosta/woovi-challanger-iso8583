import { getIssuerConnection } from '../tcpConnectionManager.ts';
import { createIssuerNotFoundError } from '../errors.ts';
import type { Transaction } from '../types.ts';
import type { ConnectorResult } from './types.ts';

type Bank = 'hallan' | 'woovi';

const pickBank = (pan: string): Bank | null => {
  if (pan.startsWith('4026')) return 'hallan';
  if (pan.startsWith('4815')) return 'woovi';
  return null;
};

export const visaConnector = async (transaction: Transaction): Promise<ConnectorResult> => {
  const pan = transaction.cardNumber;
  const bank = pickBank(pan);

  if (!bank) {
    throw createIssuerNotFoundError('Issuer not found for this BIN', '15', 'visa', pan);
  }

  if (bank === 'woovi') {
    const message = `[ROUTING][VISA-WOOVI] PAN ${pan} routed to Woovi bank (no TCP issuer available)`;
    console.log(message);
    return { name: 'visa-woovi', noop: true, bank, message };
  }

  const socket = await getIssuerConnection();

  console.log(`[ROUTING][VISA-HALLAN] Routing PAN ${pan} to issuer`);

  return { name: 'visa-hallan', socket };
};
