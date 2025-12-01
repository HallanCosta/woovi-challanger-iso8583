import { getIssuerConnection } from '../issuerClient.ts';
import { findBankByPan } from '../helpers/brands.ts';
import type { ConnectorResult } from '../types.ts';

export const pix = async (pan: string, processingCode: string): Promise<ConnectorResult> => {
  const bank = findBankByPan(pan);

  if (!bank) {
    return { name: 'pix-unknown', noop: true, message: 'Issuer not found (BIN)' };
  }

  if (bank === 'woovi') {
    const message = `[BRANDS][PIX-WOOVI] PAN ${pan} -> Woovi (no TCP forward) | PC ${processingCode}`;
    console.log(message);
    return { name: 'pix-woovi', noop: true, message };
  }

  const socket = await getIssuerConnection();
  console.log(`[BRANDS][PIX-HALLAN] Routing PAN ${pan} to issuer`);
  console.log(`[BRANDS][PIX-HALLAN] Routing ProcessingCode ${processingCode} to issuer`);
  return { name: 'pix-hallan', socket };
};
