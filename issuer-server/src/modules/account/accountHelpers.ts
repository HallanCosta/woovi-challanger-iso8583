import type { Transfer } from 'tigerbeetle-node';

import type { Account } from './__fixtures__/accounts.ts';

export type LedgerTransfer = {
  id: string;
  debit_account_id: string;
  credit_account_id: string;
  amount: string;
  code: number;
  ledger: number;
  timestamp: string;
};

export type AccountLedgerView = {
  id: string;
  name: string;
  credits_posted: string;
  debits_posted: string;
  balance: string;
  last_debit_transfer: LedgerTransfer | null;
};

export const mapTransferToLedgerTransfer = (transfer: Transfer): LedgerTransfer => ({
  id: transfer.id.toString(),
  debit_account_id: transfer.debit_account_id.toString(),
  credit_account_id: transfer.credit_account_id.toString(),
  amount: transfer.amount.toString(),
  code: transfer.code,
  ledger: transfer.ledger,
  timestamp: transfer.timestamp.toString(),
});

export const mapAccountToLedgerView = (
  account: { id: bigint; credits_posted: bigint; debits_posted: bigint },
  name: string,
  lastDebit?: Transfer | null
): AccountLedgerView => {
  const balance = account.credits_posted - account.debits_posted;

  return {
    id: account.id.toString(),
    name,
    credits_posted: account.credits_posted.toString(),
    debits_posted: account.debits_posted.toString(),
    balance: balance.toString(),
    last_debit_transfer: lastDebit ? mapTransferToLedgerTransfer(lastDebit) : null,
  };
};

export const toUserData128 = (label: string): bigint => {
  const buf = Buffer.alloc(16);
  buf.write(label.slice(0, 16), 'utf8');
  return BigInt(`0x${buf.toString('hex')}`);
};

export const findAccountMeta = (accountId: bigint, accounts: readonly Account[]) =>
  accounts.find((account) => account.id === accountId);
