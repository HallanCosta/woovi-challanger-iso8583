import { mastercard } from './brands/mastercard.ts';
import { visa } from './brands/visa.ts';
import { pix } from './brands/pix.ts';
import { findBrandByPan } from './helpers/brands.ts';
import type { ConnectorResult } from './types.ts';

export async function routePan(pan: string, processingCode: string): Promise<ConnectorResult> {
  const brand = findBrandByPan(pan);

  if (brand === 'MASTERCARD') return mastercard(pan, processingCode);
  if (brand === 'VISA') return visa(pan, processingCode);
  if (brand === 'PIX') return pix(pan, processingCode);

  return { name: 'unknown', noop: true, message: 'Issuer not found (BIN)' };
}
