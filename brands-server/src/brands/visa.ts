import { getIssuerConnection } from '../issuerClient.ts';
import { findBankByPan } from '../helpers/brands.ts';
import type { ConnectorResult } from '../types.ts';

export const visa = async (pan: string, processingCode?: string): Promise<ConnectorResult> => {
  const bank = findBankByPan(pan);

  if (!bank) {
    return { name: 'visa-unknown', noop: true, message: 'Issuer not found (BIN)' };
  }

  if (bank === 'woovi') {
    const message = `[BRANDS][VISA-WOOVI] PAN ${pan} -> Woovi (no TCP forward) | PC ${processingCode ?? 'n/a'}`;
    console.log(message);
    return { name: 'visa-woovi', noop: true, message };
  }

  const socket = await getIssuerConnection();
  console.log(`[BRANDS][VISA-HALLAN] Routing PAN ${pan} to issuer`);
  console.log(`[BRANDS][VISA-HALLAN] Routing ProcessingCode ${processingCode}`);

  return { name: 'visa-hallan', socket };
};
