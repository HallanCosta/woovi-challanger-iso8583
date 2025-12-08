import { CreateTransferError } from 'tigerbeetle-node';
import { getTbClient } from '../tigerbeetle/tbClient.ts';
import { newId } from '../utils/id.ts';
import { ISO8583_RESPONSE_CODES_NAMES } from '../../../lib/iso8583/responseCodes.ts';

export type CaptureResult = {
  rc: string;
};

export const createLedgerEntry = async (
  debitAccountId: bigint,
  merchantAccountId: bigint,
  amount: bigint
): Promise<CaptureResult> => {
  const transferId = newId();
  const tb = getTbClient();

  try {
    const transfer_errors = await tb.createTransfers([
      {
        id: transferId,
        debit_account_id: debitAccountId,
        credit_account_id: merchantAccountId,
        amount,
        pending_id: 0n,
        user_data_128: 0n,
        user_data_64: 0n,
        user_data_32: 0,
        timeout: 0,
        flags: 0,
        ledger: 1,
        code: 1,
        timestamp: 0n,
      },
    ]);

    if (transfer_errors.length > 0) {
      for (const error of transfer_errors) {
        const mapped = mapTbErrorToResponseCodeIso8583(error.result);

        switch (error.result) {
          case CreateTransferError.exists:
            console.error(`Batch transfer at ${error.index} already exists.`);
            break;
          default:
            console.error(
              `Batch transfer at ${error.index} failed to create: ${
                CreateTransferError[error.result]
              }.`,
            );
        }

        // Return on first error because we send a single transfer per batch.
        return { rc: mapped };
      }
    }

    return {
      rc: ISO8583_RESPONSE_CODES_NAMES.APPROVED
    };
  } catch (err: any) {
    console.error(`[TB][LEDGER][${transferId}] exception=${err?.message ?? err}`);

    return {
      rc: ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE
    };
  }
};

const mapTbErrorToResponseCodeIso8583 = (errorResult: number): string => {
  const FUND_ERRORS = new Set([
    CreateTransferError.exceeds_pending_transfer_amount,
    CreateTransferError.exceeds_credits,
    CreateTransferError.exceeds_debits,
  ]);

  const NOT_FOUND_OR_STRUCTURAL_ERRORS = new Set([
    CreateTransferError.debit_account_not_found,
    CreateTransferError.credit_account_not_found,
    CreateTransferError.accounts_must_have_the_same_ledger,
    CreateTransferError.transfer_must_have_the_same_ledger_as_accounts,
    CreateTransferError.code_must_not_be_zero,
  ]);

  if (FUND_ERRORS.has(errorResult)) {
    return ISO8583_RESPONSE_CODES_NAMES.NOT_SUFFICIENT_FUNDS;
  }

  if (errorResult === CreateTransferError.exists) {
    return ISO8583_RESPONSE_CODES_NAMES.DUPLICATE_TRANSMISSION;
  }

  if (NOT_FOUND_OR_STRUCTURAL_ERRORS.has(errorResult)) {
    return ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE;
  }

  // fallback
  return ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE;
};
