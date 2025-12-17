import type { Socket } from 'node:net';

import { createAuthMessage } from '../message/createAuthMessage.ts';
import { sendIso8583Message, type SendIso8583MessageResponse } from '../message/sendMessage.ts';
import { DEBUG } from '../../config/env.ts';
import { logMessage } from '../../utils/logs.ts';
import type { Transaction } from './cardTransaction.ts';
import { TRANSACTION_STAGE } from '../../enums/stage.ts';

export type CardAuthorization = {
  transaction: Transaction;
  socket: Socket;
  brandName: string;
  connectorName: string;
};

export const authorizeCardTransaction = async ({
  transaction,
  socket,
  brandName,
  connectorName,
}: CardAuthorization): Promise<SendIso8583MessageResponse> => {
  const buffer = createAuthMessage({ transaction });

  if (DEBUG) {
    logMessage({ stage: TRANSACTION_STAGE.AUTHORIZATION, transaction, brandName, connectorName, buffer });
  }

  return sendIso8583Message({ socket, buffer, label: 'AUTHORIZATION' });
};
