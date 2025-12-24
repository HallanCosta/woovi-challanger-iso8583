import { TRANSACTION_STAGE } from '../../../enums/stage.ts';
import { createCardTransaction } from './createCardTransaction.ts';
import { type CardFlowInput, type CardFlowResult } from './authorizeAndCaptureCardFlow.ts';

// Apenas captura/financial (MTI 0200).
export const captureCard = async ({
  transaction,
  client,
  processingCodeName,
  brandName,
  connectorName,
}: CardFlowInput): Promise<CardFlowResult> => {
  const capture = await createCardTransaction({
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
      mti: capture.mti,
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
    mti: capture.mti,
  };
};
