import { CreateTransferError } from 'tigerbeetle-node';
import { ISO8583_RESPONSE_CODES_NAMES } from '../../../../lib/iso8583/responseCodes.ts';

const TB_ERROR_MAP: Record<string | number, string> = {
  // Fund errors
  exceeds_pending: ISO8583_RESPONSE_CODES_NAMES.NOT_SUFFICIENT_FUNDS,
  exceeds_pending_transfer_amount: ISO8583_RESPONSE_CODES_NAMES.NOT_SUFFICIENT_FUNDS,
  exceeds_credits: ISO8583_RESPONSE_CODES_NAMES.NOT_SUFFICIENT_FUNDS,
  exceeds_debits: ISO8583_RESPONSE_CODES_NAMES.NOT_SUFFICIENT_FUNDS,
  [CreateTransferError.exceeds_pending_transfer_amount]:
    ISO8583_RESPONSE_CODES_NAMES.NOT_SUFFICIENT_FUNDS,
  [CreateTransferError.exceeds_credits]: ISO8583_RESPONSE_CODES_NAMES.NOT_SUFFICIENT_FUNDS,
  [CreateTransferError.exceeds_debits]: ISO8583_RESPONSE_CODES_NAMES.NOT_SUFFICIENT_FUNDS,

  // Duplicate
  exists: ISO8583_RESPONSE_CODES_NAMES.DUPLICATE_TRANSMISSION,
  [CreateTransferError.exists]: ISO8583_RESPONSE_CODES_NAMES.DUPLICATE_TRANSMISSION,

  // Not found / structural
  debit_account_not_found: ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
  credit_account_not_found: ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
  accounts_must_have_the_same_ledger: ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
  transfer_must_have_the_same_ledger_as_accounts:
    ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
  code_must_not_be_zero: ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
  [CreateTransferError.debit_account_not_found]:
    ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
  [CreateTransferError.credit_account_not_found]:
    ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
  [CreateTransferError.accounts_must_have_the_same_ledger]:
    ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
  [CreateTransferError.transfer_must_have_the_same_ledger_as_accounts]:
    ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
  [CreateTransferError.code_must_not_be_zero]: ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE,
};

export const mapTbErrorToResponseCodeIso8583 = (errorResult: number | string): string =>
  TB_ERROR_MAP[errorResult] ?? ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE;
