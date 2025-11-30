import { getIssuerConnection } from '../tcpConnectionManager.ts';
import { createIssuerNotFoundError } from '../errors.ts';
import type { Transaction } from '../types.ts';
import type { ConnectorResult } from './types.ts';

type Bank = 'hallan' | 'woovi';

const pickBank = (pan: string): Bank | null => {
  if (pan.startsWith('3907')) return 'hallan';
  if (pan.startsWith('3910')) return 'woovi';
  return null;
};

export const pixConnector = async (transaction: Transaction): Promise<ConnectorResult> => {
  const pan = transaction.cardNumber;
  const bank = pickBank(pan);

  if (!bank) {
    throw createIssuerNotFoundError('Issuer not found for this BIN', '15', 'pix', pan);
  }

  if (bank === 'woovi') {
    const message = `[ROUTING][PIX-WOOVI] PAN ${pan} routed to Woovi bank (no TCP issuer available)`;
    console.log(message);
    return { name: 'pix-woovi', noop: true, bank, message };
  }

  const socket = await getIssuerConnection();

  console.log(`[ROUTING][PIX-${bank.toUpperCase()}] Routing PAN ${pan} to ${bank} issuer (SPI sim)`);

  return { name: `pix-${bank}`, socket };
};
