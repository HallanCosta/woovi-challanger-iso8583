import { ACCOUNTS, CLEARING } from '../src/account/accounts.ts';
import { getTbClient, closeTbClient } from '../src/tigerbeetle/tbClient.ts';

type Meta = {
  id: bigint;
  bank: string;
  type: string;
  name: string
};

const metas: Meta[] = [
  ...ACCOUNTS.map((account) => ({ id: account.id, bank: 'Hallan', type: 'user', name: account.name })),
  { id: CLEARING.id, bank: '-', type: 'clearing', name: CLEARING.name },
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
