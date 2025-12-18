import { getBrandConnection } from '../clients/brandClient.ts';
import type { Transaction } from '../../card/cardTypes.ts';
import type { BrandConnectorResult } from './types.ts';

export const mastercardConnector = async (transaction: Transaction): Promise<BrandConnectorResult> => {
  const pan = transaction.cardNumber;

  const socket = await getBrandConnection();

  console.log(`[ROUTING][MASTERCARD] Routing PAN ${pan} to brands server`);

  return { type: 'active', name: 'mastercard-brand', socket };
};
