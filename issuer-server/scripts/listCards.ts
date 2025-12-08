import { ISSUED_CARDS as CARDS } from '../src/data/cards.ts';

const rows = CARDS.map((card) => ({
  pan: card.pan,
  bank: card.bank,
  expiry: card.expiry,
  accountId: card.accountId.toString(),
  merchantAccountId: card.merchantAccountId.toString(),
}));

console.table(rows);
