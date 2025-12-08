import { ACCOUNTS } from './accounts.ts';
import { getTbClient } from '../tigerbeetle/tbClient.ts';
import { BANKS, CLEARING } from '../bank/banks.ts';
import { newId } from '../utils/id.ts';

const ALL_ACCOUNT_IDS = [
  ...BANKS.flatMap((b) => b.users.map((u) => u.accountId)),
  ...BANKS.map((b) => b.merchant.accountId),
  CLEARING.accountId,
];

const FUND_AMOUNT = 1_000_000n; // 10.000,00 em centavos

type AccountState = {
  id: bigint;
  debits_posted: bigint;
  credits_posted: bigint;
};

const fetchAccounts = async (ids: readonly bigint[]): Promise<AccountState[]> => {
  const tb = getTbClient();
  const result = await tb.lookupAccounts(ids);
  return result as AccountState[];
};

export const zeroOutAccounts = async (): Promise<void> => {
  const tb = getTbClient();
  const accounts = await fetchAccounts(ALL_ACCOUNT_IDS);
  const transfers = accounts.flatMap((acc) => {
    const net = acc.credits_posted - acc.debits_posted;
    if (net === 0n) return [];
    const amount = net < 0n ? -net : net;
    const debit_account_id = net > 0n ? acc.id : CLEARING.accountId;
    const credit_account_id = net > 0n ? CLEARING.accountId : acc.id;
    return [
      {
        id: newId(),
        debit_account_id,
        credit_account_id,
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
    ];
  });

  if (transfers.length) {
    const res = await tb.createTransfers(transfers);
    if (res.length) {
      throw new Error(`Failed to zero accounts: ${JSON.stringify(res)}`);
    }
  }
};

export const fundUserAccounts = async (): Promise<void> => {
  const tb = getTbClient();
  const userAccounts = BANKS.flatMap((b) => b.users.map((u) => u.accountId));

  const transfers = userAccounts.map((accountId) => ({
    id: newId(),
    debit_account_id: CLEARING.accountId,
    credit_account_id: accountId,
    amount: FUND_AMOUNT,
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
    throw new Error(`Failed to fund user accounts: ${JSON.stringify(res)}`);
  }
};

export const resetAndFundAccounts = async (): Promise<void> => {
  await zeroOutAccounts();
  await fundUserAccounts();
};
