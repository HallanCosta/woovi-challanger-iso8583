import { getBrandConnection } from '../brandClient.ts';
import type { Transaction } from '../types.ts';
import type { ConnectorResult } from './types.ts';

export const visaConnector = async (transaction: Transaction): Promise<ConnectorResult> => {
  const pan = transaction.cardNumber;
  const socket = await getBrandConnection();

  console.log(`[ROUTING][VISA] Routing PAN ${pan} to brands server`);

  return { name: 'visa-brand', socket };
};
