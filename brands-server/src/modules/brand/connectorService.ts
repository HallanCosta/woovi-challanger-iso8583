import { mastercard } from './connectors/mastercard.ts';
import { pix } from './connectors/pix.ts';
import { visa } from './connectors/visa.ts';
import { findBrandByPan } from './brandHelpers.ts';
import type { ConnectorResult } from './brandTypes.ts';

export async function routePan(pan: string, processingCode?: string): Promise<ConnectorResult> {
  const brand = findBrandByPan(pan);

  if (brand === 'MASTERCARD') return mastercard(pan, processingCode);
  if (brand === 'VISA') return visa(pan, processingCode);
  if (brand === 'PIX') return pix(pan, processingCode);

  return { name: 'unknown', noop: true, message: 'Issuer not found (BIN)' };
}
