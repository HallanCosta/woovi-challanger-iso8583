import { BANKS, CLEARING } from '../src/data/banks.ts';

const rows = [
  ...BANKS.flatMap((bank) =>
    bank.users.map((user) => ({
      bank: bank.name,
      type: 'user',
      name: user.name,
      accountId: user.accountId.toString(),
      ledger: 1,
    }))
  ),
  ...BANKS.map((bank) => ({
    bank: bank.name,
    type: 'merchant',
    name: bank.merchant.name,
    accountId: bank.merchant.accountId.toString(),
    ledger: 1,
  })),
  {
    bank: '',
    type: 'clearing',
    name: CLEARING.name,
    accountId: CLEARING.accountId.toString(),
    ledger: 1,
  },
];

console.table(rows);
