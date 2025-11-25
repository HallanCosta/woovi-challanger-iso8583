import type { Socket } from 'node:net';
import type { Transaction } from '../types.ts';

export interface ActiveConnectorResult {
  name: string;
  socket: Socket;
}

export interface NoopConnectorResult {
  name: string;
  noop: true;
  bank: 'woovi' | 'hallan';
  message: string;
}

export type ConnectorResult = ActiveConnectorResult | NoopConnectorResult;

export type ConnectorFn = (transaction: Transaction) => Promise<ConnectorResult>;
