import { getBrandConnection } from '../brandClient.ts';
import type { Transaction } from '../../card/cardTransaction.ts';
import type { BrandConnectorResult } from './types.ts';

export const eloConnector = async (transaction: Transaction): Promise<BrandConnectorResult> => {
  const socket = await getBrandConnection();

  console.log(`[ROUTING][ELO-CONNECTOR] Routing PAN ${transaction.cardNumber} to issuer`);

  return { type: 'active', name: 'elo-connector', socket };
};
