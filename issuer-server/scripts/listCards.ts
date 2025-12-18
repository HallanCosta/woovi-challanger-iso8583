import { CARDS } from '../src/modules/card/__fixtures__/cards.ts';

const rows = CARDS.map((card) => ({
  pan: card.pan,
  expiry: card.expiry,
  accountId: card.accountId.toString(),
}));

console.table(rows);
