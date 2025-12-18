import type { Socket } from 'node:net';

export interface ConnectorResult {
  name: string;
  socket?: Socket;
  noop?: boolean;
  message?: string;
}

export type ConnectorFn = (pan: string, processingCode?: string) => Promise<ConnectorResult>;
