import { getIssuerConnection } from '../issuerClient.ts';
import { findBankByPan } from '../helpers/brands.ts';
import type { ConnectorResult } from '../types.ts';

export const mastercard = async (pan: string, processingCode: string): Promise<ConnectorResult> => {
  const bank = findBankByPan(pan);

  if (!bank) {
    return { name: 'mastercard-unknown', noop: true, message: 'Issuer not found (BIN)' };
  }

  if (bank === 'woovi') {
    const message = `[BRANDS][MASTERCARD-WOOVI] PAN ${pan} -> Woovi (no TCP forward) | PC ${processingCode ?? 'n/a'}`;
    console.log(message);
    return { name: 'mastercard-woovi', noop: true, message };
  }

  const socket = await getIssuerConnection();
  console.log(`[BRANDS][MASTERCARD->ISSUER:HALLAN] Routing PAN ${pan} to issuer | PC ${processingCode}`);
  console.log(`[BRANDS][MASTERCARD->ISSUER:HALLAN] Routing ProcessingCode ${processingCode}`);
  return { name: 'mastercard-hallan', socket };
};
