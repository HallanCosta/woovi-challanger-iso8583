import type { Socket } from 'node:net';

import { authorizeCardTransaction } from './cardAuthorization.ts';
import { cardTransaction } from './cardTransaction.ts';
import { TRANSACTION_STAGE, type TransactionStage } from '../../enums/stage.ts';
import { DEBUG } from '../../config/env.ts';
import type { Transaction } from './cardTransaction.ts';

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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Apenas autorização (MTI 0100).
export const authorizeCard = async ({
  transaction,
  client,
  processingCodeName,
  brandName,
  connectorName,
}: CardFlowInput): Promise<CardFlowResult> => {
  const auth = await authorizeCardTransaction({
    transaction,
    socket: client,
    brandName,
    connectorName,
  });

  if (!auth.isApproved) {
    console.log(`❌ AUTH FAILED: ${auth.description} (${auth.responseCode})`);

    return {
      success: false,
      responseCode: auth.responseCode,
      amount: transaction.amount,
      message: auth.description,
      type: processingCodeName,
      brandName,
      stage: TRANSACTION_STAGE.AUTHORIZATION,
    };
  }

  return {
    success: true,
    responseCode: auth.responseCode,
    amount: transaction.amount,
    message: auth.description,
    type: processingCodeName,
    brandName,
  };
};

// Apenas captura/financial (MTI 0200).
export const captureCard = async ({
  transaction,
  client,
  processingCodeName,
  brandName,
  connectorName,
}: CardFlowInput): Promise<CardFlowResult> => {
  const capture = await cardTransaction({
    transaction,
    socket: client,
    brandName,
    connectorName,
  });

  if (!capture.isApproved) {
    console.log(`❌ SALE FAILED: ${capture.description} (${capture.responseCode})`);

    return {
      success: false,
      responseCode: capture.responseCode,
      amount: transaction.amount,
      message: capture.description,
      type: processingCodeName,
      brandName,
      stage: TRANSACTION_STAGE.FINANCIAL,
    };
  }

  return {
    success: true,
    responseCode: capture.responseCode,
    amount: transaction.amount,
    message: capture.description,
    type: processingCodeName,
    brandName,
  };
};

// Fluxo completo: autorização e, depois, captura.
export const authorizeAndCaptureCardFlow = async (input: CardFlowInput): Promise<CardFlowResult> => {
  // Envia 0100 e espera 0210
  const auth = await authorizeCard(input);

  if (!auth.success) {
    return auth;
  }

  console.log(`✅ Authorized: ${auth.responseCode}`);

  // Simula liquidação posterior: espera 5s antes da captura (0200).
  await delay(5000);

  // Envia 0200 e espera 0220
  const capture = await captureCard(input);

  if (!capture.success) {
    return capture;
  }

  console.log(`✅ Approved: ${capture.responseCode}`);

  return capture;
};

// Fluxo direto de captura (ex.: PIX envia 0200 apenas e espera 0220).
export const pixTransactionFlow = async (input: CardFlowInput): Promise<CardFlowResult> => {
  const capture = await captureCard(input);

  if (!capture.success) {
    console.log(`❌ SALE FAILED: ${capture.message} (${capture.responseCode})`);

    return {
      ...capture,
      stage: TRANSACTION_STAGE.FINANCIAL,
    };
  }

  if (DEBUG) {
    console.log(`✅ Approved: ${capture.responseCode}`);
  }

  return capture;
};
