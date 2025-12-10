import { seedCreateAccounts } from '../src/account/createAccounts.ts';
import { closeTbClient } from '../src/tigerbeetle/tbClient.ts';

async function main() {
  await seedCreateAccounts();
  await closeTbClient();
  console.log('Contas básicas criadas/asseguradas no TigerBeetle.');
}

main()
