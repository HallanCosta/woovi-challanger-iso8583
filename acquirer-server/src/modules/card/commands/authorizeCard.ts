import { authorizeCardTransaction } from '../queries/authorizeCardTransaction.ts';
import { TRANSACTION_STAGE, type CardFlowInput, type CardFlowResult } from './flow/cardFlowTypes.ts';

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
