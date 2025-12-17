import { getBrandConnection } from '../brandClient.ts';
import type { Transaction } from '../../card/cardTransaction.ts';
import type { BrandConnectorResult } from './types.ts';

export const visaConnector = async (transaction: Transaction): Promise<BrandConnectorResult> => {
  const pan = transaction.cardNumber;
  const socket = await getBrandConnection();

  console.log(`[ROUTING][VISA] Routing PAN ${pan} to brands server`);

  return { type: 'active', name: 'visa-brand', socket };
};
