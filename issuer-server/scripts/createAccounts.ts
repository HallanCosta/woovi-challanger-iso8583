import { seedCreateAccounts } from '../src/modules/account/commands/seedCreateAccounts.ts';
import { closeTbClient } from '../src/modules/tigerbeetle/tbClient.ts';

async function main() {
  console.log('Contas básicas criadas no TigerBeetle.');
  await seedCreateAccounts();
  await closeTbClient();
}

main();
