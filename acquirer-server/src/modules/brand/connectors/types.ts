import type { Socket } from 'node:net';
import type { Transaction } from '../../card/cardTypes.ts';

export interface BrandActiveConnectorResult {
  type: 'active';
  name: string;
  socket: Socket;
}

export interface BrandNoopConnectorResult {
  type: 'noop';
  name: string;
  message: string;
}

export type BrandConnectorResult = BrandActiveConnectorResult | BrandNoopConnectorResult;

export type BrandConnectorFn = (transaction: Transaction) => Promise<BrandConnectorResult>;
