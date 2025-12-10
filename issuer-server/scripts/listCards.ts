import { CARDS } from '../src/card/cards.ts';

const rows = CARDS.map((card) => ({
  pan: card.pan,
  expiry: card.expiry,
  accountId: card.accountId.toString(),
}));

console.table(rows);
