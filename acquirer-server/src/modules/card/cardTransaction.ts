import type { Socket } from 'node:net';

import { createPurchaseMessage } from '../message/createPurchaseMessage.ts';
import { sendIso8583Message, type SendIso8583MessageResponse } from '../message/sendMessage.ts';
import { DEBUG } from '../../config/env.ts';
import { logMessage } from '../../utils/logs.ts';
import { TRANSACTION_STAGE } from '../../enums/stage.ts';

export interface Transaction {
  amount: string;              // Value to response code
  transactionId: string;       // Transaction ID (6 dígitos)
  acquirerInstitution: string; // Code acquirer (LLVAR)
  merchantId: string;          // ID do merchant (hex) - ajustado para length par
  currency: string;            // Currency (hex) - 764 = BRL
  cardNumber: string;          // Card number with brand pix (PAN)
  processingCode?: string;     // Processing code
  holdId?: string;             // Hold identifier returned by issuer (DE48/62)
}

export type CardTransaction = {
  transaction: Transaction;
  socket: Socket;
  brandName: string;
  connectorName: string;
};

export const cardTransaction = async ({
  transaction,
  socket,
  brandName,
  connectorName,
}: CardTransaction): Promise<SendIso8583MessageResponse> => {
  const buffer = createPurchaseMessage({ transaction });

  if (DEBUG) {
    logMessage({ stage: TRANSACTION_STAGE.FINANCIAL, transaction, brandName, connectorName, buffer });
  }

  return sendIso8583Message({ socket, buffer, label: 'FINANCIAL' });
};
