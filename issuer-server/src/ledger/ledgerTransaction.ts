import { CreateTransferError } from 'tigerbeetle-node';
import { getTbClient } from '../tigerbeetle/tbClient.ts';
import { newId } from '../utils/id.ts';
import { ISO8583_RESPONSE_CODES_NAMES } from '../../../lib/iso8583/responseCodes.ts';

type CreateLedgerEntryResponse = {
  rc: string;
};

type CreateLedgerEntryParams = {
  debitAccountId: bigint;
  merchantAccountId: bigint;
  amount: bigint;
};

export const createLedgerEntry = async ({
  debitAccountId,
  merchantAccountId,
  amount
}: CreateLedgerEntryParams): Promise<CreateLedgerEntryResponse> => {
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
        const responseCodeError = mapTbErrorToResponseCodeIso8583(error.result);

        return { rc: responseCodeError };
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

const TB_ERROR_MAP: Record<string | number, string> = {
  // Fund errors
  exceeds_pending: ISO8583_RESPONSE_CODES_NAMES.NOT_SUFFICIENT_FUNDS,
  exceeds_pending_transfer_amount: ISO8583_RESPONSE_CODES_NAMES.NOT_SUFFICIENT_FUNDS,
  exceeds_credits: ISO8583_RESPONSE_CODES_NAMES.NOT_SUFFICIENT_FUNDS,
  exceeds_debits: ISO8583_RESPONSE_CODES_NAMES.NOT_SUFFICIENT_FUNDS,
  [CreateTransferError.exceeds_pending_transfer_amount]: ISO8583_RESPONSE_CODES_NAMES.NOT_SUFFICIENT_FUNDS,
  [CreateTransferError.exceeds_credits]: ISO8583_RESPONSE_CODES_NAMES.NOT_SUFFICIENT_FUNDS,
  [CreateTransferError.exceeds_debits]: ISO8583_RESPONSE_CODES_NAMES.NOT_SUFFICIENT_FUNDS,

  // Duplicate
  exists: ISO8583_RESPONSE_CODES_NAMES.DUPLICATE_TRANSMISSION,
  [CreateTransferError.exists]: ISO8583_RESPONSE_CODES_NAMES.DUPLICATE_TRANSMISSION,

  // Not found / structural
  debit_account_not_found: ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
  credit_account_not_found: ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
  accounts_must_have_the_same_ledger: ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
  transfer_must_have_the_same_ledger_as_accounts: ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
  code_must_not_be_zero: ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
  [CreateTransferError.debit_account_not_found]: ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
  [CreateTransferError.credit_account_not_found]: ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
  [CreateTransferError.accounts_must_have_the_same_ledger]: ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
  [CreateTransferError.transfer_must_have_the_same_ledger_as_accounts]: ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
  [CreateTransferError.code_must_not_be_zero]: ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
};

const mapTbErrorToResponseCodeIso8583 = (errorResult: number | string): string =>
  TB_ERROR_MAP[errorResult] ?? ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE;
