import { getBrandConnection } from '../brandClient.ts';
import type { Transaction } from '../types.ts';
import type { ConnectorResult } from './types.ts';

export const brandConnector = async (transaction: Transaction): Promise<ConnectorResult> => {
  const pan = transaction.cardNumber;
  const socket = await getBrandConnection();

  console.log(`[ROUTING][BRAND-UNKNOWN] Routing PAN ${pan} to brands server`);

  return { name: 'brand-unknown', socket };
};
