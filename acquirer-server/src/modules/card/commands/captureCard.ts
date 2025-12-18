import { createCardTransaction } from './createCardTransaction.ts';
import { TRANSACTION_STAGE, type CardFlowInput, type CardFlowResult } from './flow/cardFlowTypes.ts';

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
