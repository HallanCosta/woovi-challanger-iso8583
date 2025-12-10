import { ACCOUNTS, CLEARING } from '../src/account/accounts.ts';
import { CARD_BINS } from '../src/card/cards.ts';

console.log('Bins:', CARD_BINS.join(', '));

const rows = ACCOUNTS.map((account) => ({
  name: account.name,
  accountId: account.id.toString(),
}));

console.table(rows);
console.log('\nClearing:', `${CLEARING.name} (${CLEARING.id.toString()})`);
