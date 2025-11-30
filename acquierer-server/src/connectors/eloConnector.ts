import { getIssuerConnection } from '../tcpConnectionManager.ts';
import type { Transaction } from '../types.ts';
import type { ConnectorResult } from './types.ts';

export const eloConnector = async (transaction: Transaction): Promise<ConnectorResult> => {
  const socket = await getIssuerConnection();

  console.log(`[ROUTING][ELO-CONNECTOR] Routing PAN ${transaction.cardNumber} to issuer`);

  return { name: 'elo-connector', socket };
};
