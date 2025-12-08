import { BANKS, CLEARING } from '../src/data/banks.ts';

const rows = BANKS.map((bank) => ({
  bank: bank.name,
  users: bank.users.map((u) => u.name).join(', '),
  merchant: `${bank.merchant.name} (${bank.merchant.accountId.toString()})`,
}));

console.table(rows);
console.log('\nClearing:', `${CLEARING.name} (${CLEARING.accountId.toString()})`);
