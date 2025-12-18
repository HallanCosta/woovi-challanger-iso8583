import { seedCreateAccounts } from '../src/modules/account/commands/seedCreateAccounts.ts';
import { closeTbClient } from '../src/modules/tigerbeetle/tbClient.ts';

async function main() {
  await seedCreateAccounts();
  await closeTbClient();

  console.log('Ledger resetado: contas recriadas e saldos iniciais restabelecidos.');
}

main();
