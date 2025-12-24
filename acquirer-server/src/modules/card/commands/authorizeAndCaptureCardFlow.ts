import type { Socket } from 'node:net';

import type { TransactionStage } from '../../../enums/stage.ts';
import type { Transaction } from '../cardTypes.ts';
import { authorizeCard } from './authorizeCard.ts';
import { captureCard } from './captureCard.ts';

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
  mti?: string;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Fluxo completo: autorização e, depois, captura.
export const authorizeAndCaptureCardFlow = async (input: CardFlowInput): Promise<CardFlowResult> => {
  // Envia 0100 e espera 0210
  const auth = await authorizeCard(input);

  if (!auth.success) {
    return auth;
  }

  console.log(`✅ Authorized: ${auth.responseCode}`);

  // Simula liquidação posterior: espera 5s antes da captura (0200).
  await delay(3000);

  // Envia 0200 e espera 0220
  const capture = await captureCard(input);

  if (!capture.success) {
    return capture;
  }

  console.log(`✅ Approved: ${capture.responseCode}`);

  return capture;
};
