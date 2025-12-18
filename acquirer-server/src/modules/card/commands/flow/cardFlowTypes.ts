import type { Socket } from 'node:net';

import { TRANSACTION_STAGE, type TransactionStage } from '../../../../enums/stage.ts';
import type { Transaction } from '../../cardTypes.ts';

export type CardFlowInput = {
  transaction: Transaction;
  client: Socket;
  processingCodeName: string;
  brandName: string;
  connectorName: string;
};

export type CardFlowResult = {
  success: boolean;
  responseCode: string;
  amount: string;
  message: string;
  type: string;
  brandName: string;
  stage?: TransactionStage;
};

export { TRANSACTION_STAGE };
