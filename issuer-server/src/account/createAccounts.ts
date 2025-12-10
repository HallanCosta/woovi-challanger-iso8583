import { CreateAccountError } from 'tigerbeetle-node';
import { ACCOUNTS, CLEARING, type Account } from './accounts.ts';
import { getTbClient } from '../tigerbeetle/tbClient.ts';

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

const toUserData128 = (label: string): bigint => {
  const buf = Buffer.alloc(16);
  buf.write(label.slice(0, 16), 'utf8');
  return BigInt(`0x${buf.toString('hex')}`);
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

export const createCoreAccounts = async (): Promise<void> => {
  const accounts = buildCoreAccounts();
  await persistAccounts(accounts);
};
