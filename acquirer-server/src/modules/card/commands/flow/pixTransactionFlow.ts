import { DEBUG } from '../../../../config/env.ts';
import { TRANSACTION_STAGE, type CardFlowInput, type CardFlowResult } from './cardFlowTypes.ts';
import { captureCard } from '../captureCard.ts';

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
