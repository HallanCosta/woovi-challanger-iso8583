import { BANKS } from '../src/bank/banks.ts';

const rows = BANKS.flatMap((bank) =>
  bank.users.map((user) => ({
    bank: bank.name,
    name: user.name,
    accountId: user.accountId.toString(),
    ledger: 1,
  }))
);

console.table(rows);
