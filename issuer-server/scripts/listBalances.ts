import { BANKS, CLEARING } from '../src/bank/banks.ts';
import { getTbClient, closeTbClient } from '../src/tigerbeetle/tbClient.ts';

type Meta = {
  id: bigint;
  bank: string;
  type: string;
  name: string
};

const metas: Meta[] = [
  ...BANKS.flatMap((bank) =>
    bank.users.map((user) => ({ id: user.accountId, bank: bank.name, type: 'user', name: user.name }))
  ),
  ...BANKS.map((bank) => ({
    id: bank.merchant.accountId,
    bank: bank.name,
    type: 'merchant',
    name: bank.merchant.name,
  })),
  { id: CLEARING.accountId, bank: '-', type: 'clearing', name: CLEARING.name },
];

async function main() {
  const tb = getTbClient();
  const ids = metas.map((m) => m.id);
  const accounts = await tb.lookupAccounts(ids);
  const map = new Map<bigint, any>();

  for (const acc of accounts) {
    map.set(acc.id, acc);
  }

  const rows = metas.map((m) => {
    const acc = map.get(m.id);
    const credits = acc?.credits_posted ?? 0n;
    const debits = acc?.debits_posted ?? 0n;
    const balance = credits - debits;
    return {
      bank: m.bank,
      type: m.type,
      name: m.name,
      accountId: m.id.toString(),
      balance: (balance / 100n).toString(), // em unidades monetárias
      credits_posted: credits.toString(),
      debits_posted: debits.toString(),
    };
  });

  console.table(rows);

  await closeTbClient();
}

main()
