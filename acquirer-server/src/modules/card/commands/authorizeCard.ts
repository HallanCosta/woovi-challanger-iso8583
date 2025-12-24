import { authorizeCardTransaction } from '../queries/authorizeCardTransaction.ts';
import { TRANSACTION_STAGE } from '../../../enums/stage.ts';
import { type CardFlowInput, type CardFlowResult } from './authorizeAndCaptureCardFlow.ts';

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
      mti: auth.mti,
    };
  }

  return {
    success: true,
    responseCode: auth.responseCode,
    amount: transaction.amount,
    message: auth.description,
    type: processingCodeName,
    brandName,
    mti: auth.mti,
  };
};
