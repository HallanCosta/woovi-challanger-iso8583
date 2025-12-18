import { createPurchaseMessage } from '../../message/commands/createPurchaseMessage.ts';
import { sendIso8583Message, type SendIso8583MessageResponse } from '../../message/commands/sendMessage.ts';
import { DEBUG } from '../../../config/env.ts';
import { logMessage } from '../../../utils/logs.ts';
import { TRANSACTION_STAGE } from '../../../enums/stage.ts';
import type { Transaction, SocketContext } from '../cardTypes.ts';

type CardTransactionInput = SocketContext & {
  transaction: Transaction;
};

export const createCardTransaction = async ({
  transaction,
  socket,
  brandName,
  connectorName,
}: CardTransactionInput): Promise<SendIso8583MessageResponse> => {
  const buffer = createPurchaseMessage({ transaction });

  if (DEBUG) {
    logMessage({ stage: TRANSACTION_STAGE.FINANCIAL, transaction, brandName, connectorName, buffer });
  }

  return sendIso8583Message({ socket, buffer, label: 'FINANCIAL' });
};
