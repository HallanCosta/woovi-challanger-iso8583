/**
 * Handling PIX and Card Processing using ISO8583
 * Cards with prefix (3907) are cards that issue the processing code (900000) for the transaction to be processed via PIX.
 * Cards with prefix (5162) are cards that issue the processing code (000000) for the transaction to be processed via Card.
 * Cards with prefix (4026) are cards that issue the processing code (000000) for the transaction to be processed via Card.
 */

import { BRANDS } from './modules/brand/brands.ts';
import { brandRouteTransaction } from './modules/brand/brandConnectorService.ts';
import { findBrandName, matchesPrefix } from './modules/card/cardHelpers.ts';
import { PROCESSING_CODE, PROCESSING_CODE_LABEL } from './enums/processingCode.ts';
import { authorizeAndCaptureCardFlow, pixTransactionFlow, type CardFlowInput } from './modules/card/cardFlow.ts';

import type { Transaction } from './modules/card/cardTransaction.js';
import type { BrandConnectorResult } from './modules/brand/connectors/types.ts';
import { ISO8583_RESPONSE_CODES_NAMES } from '../../lib/iso8583/responseCodes.ts';

type ProcessTransaction = { transaction: Transaction };

const acquirer = async ({ transaction }: ProcessTransaction): Promise<any> => {
  // The processing code indicates whether the transaction should be handled
  // as a PIX flow or a traditional card flow.
  if (matchesPrefix(transaction.cardNumber, BRANDS.PIX.prefixes)) {
    transaction.processingCode = PROCESSING_CODE.PIX;
  } else {
    transaction.processingCode = PROCESSING_CODE.CARD;
  }

  const processingCodeName = PROCESSING_CODE_LABEL[transaction.processingCode] ?? 'Unknown';
  const brandName = findBrandName(transaction.cardNumber);

  const connector: BrandConnectorResult = await brandRouteTransaction({ transaction });

  if (connector.type === 'noop') {
    const message = connector.message || `Routing PAN ${transaction.cardNumber} is handled outside the simulator`;

    console.log(`[ROUTING][NO-OP] ${message}`);

    return {
      success: false,
      responseCode: ISO8583_RESPONSE_CODES_NAMES.NO_SUCH_ISSUER,
      amount: transaction.amount,
      message,
      type: processingCodeName,
      brandName,
      routedTo: connector.name,
    };
  }

  const { socket: client, name: connectorName } = connector;

  // Cards: AUTH (0100) then FINANCIAL (0200). Pix: only FINANCIAL (0200).
  if (transaction.processingCode === PROCESSING_CODE.CARD) {
    return authorizeAndCaptureCardFlow({
      transaction,
      client,
      processingCodeName,
      brandName,
      connectorName,
    });
  }

  // PIX or other direct financial requests
  return pixTransactionFlow({
    transaction,
    client,
    processingCodeName,
    brandName,
    connectorName,
  });
};

export { acquirer };
