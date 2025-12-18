import { CreateAccountError } from 'tigerbeetle-node';

import { ACCOUNTS, CLEARING, type Account } from '../__fixtures__/accounts.ts';
import { getTbClient } from '../../tigerbeetle/tbClient.ts';
import { newId } from '../../../utils/id.ts';
import { toUserData128 } from '../accountHelpers.ts';

type TbAccount = {
  id: bigint;
  user_data_128: bigint;
  user_data_64: bigint;
  user_data_32: number;
  reserved: number;
  code: number;
  ledger: number;
  flags: number;
  debits_pending: bigint;
  debits_posted: bigint;
  credits_pending: bigint;
  credits_posted: bigint;
  timestamp: bigint;
};

const buildUserAccount = (account: Account): TbAccount => ({
  id: account.id,
  user_data_128: toUserData128(account.name),
  user_data_64: 0n,
  user_data_32: 0,
  reserved: 0,
  code: 1,
  ledger: 1,
  flags: 0,
  debits_pending: 0n,
  debits_posted: 0n,
  credits_pending: 0n,
  credits_posted: 0n,
  timestamp: 0n,
});

// Conta de clearing funciona como caixa central para zerar e abastecer saldos.
const buildClearingAccount = (): TbAccount => ({
  id: CLEARING.id,
  user_data_128: toUserData128(CLEARING.name),
  user_data_64: 0n,
  user_data_32: 0,
  reserved: 0,
  code: 3,
  ledger: 1,
  flags: 0,
  debits_pending: 0n,
  debits_posted: 0n,
  credits_pending: 0n,
  credits_posted: 0n,
  timestamp: 0n,
});

const buildCoreAccounts = (): TbAccount[] => {
  const accounts: TbAccount[] = [];

  ACCOUNTS.forEach((account) => {
    accounts.push(buildUserAccount(account));
  });

  accounts.push(buildClearingAccount());
  return accounts;
};

const persistAccounts = async (accounts: TbAccount[]): Promise<void> => {
  const tb = getTbClient();
  const res = await tb.createAccounts(accounts);

  if (res.length > 0) {
    const allowed = new Set([
      CreateAccountError.exists,
      'exists',
      CreateAccountError.exists_with_different_user_data_128,
      'exists_with_different_user_data_128',
      CreateAccountError.exists_with_different_user_data_64,
      'exists_with_different_user_data_64',
      CreateAccountError.exists_with_different_user_data_32,
      'exists_with_different_user_data_32',
      CreateAccountError.exists_with_different_code,
      'exists_with_different_code',
      CreateAccountError.exists_with_different_flags,
      'exists_with_different_flags',
      CreateAccountError.exists_with_different_ledger,
      'exists_with_different_ledger',
    ]);

    const nonAllowed = res.filter((e: any) => !allowed.has(e.result));

    if (nonAllowed.length) {
      throw new Error(`Failed to create TB accounts: ${JSON.stringify(nonAllowed)}`);
    }
  }
};

const seedInitialBalances = async (userIds: bigint[]): Promise<void> => {
  const tb = getTbClient();
  const INITIAL_FUND = 1_000_000n; // 10.000,00 em centavos

  const transfers = userIds.map((accountId) => ({
    id: newId(),
    debit_account_id: CLEARING.id,
    credit_account_id: accountId,
    amount: INITIAL_FUND,
    pending_id: 0n,
    user_data_128: 0n,
    user_data_64: 0n,
    user_data_32: 0,
    timeout: 0,
    flags: 0,
    ledger: 1,
    code: 1,
    timestamp: 0n,
  }));

  const res = await tb.createTransfers(transfers);
  if (res.length) {
    throw new Error(`Failed to seed balances: ${JSON.stringify(res)}`);
  }
};

export const seedCreateAccounts = async (): Promise<void> => {
  const accounts = buildCoreAccounts();
  await persistAccounts(accounts);

  // Seed initial balance for users.
  const userIds = ACCOUNTS.map((account) => account.id);
  await seedInitialBalances(userIds);
};
