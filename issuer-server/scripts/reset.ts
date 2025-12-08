import fs from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCoreAccounts } from '../src/account/createAccounts.ts';
import { fundUserAccounts, resetAndFundAccounts } from '../src/account/accountAdmin.ts';
import { closeTbClient } from '../src/tigerbeetle/tbClient.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEDGER_PATH = resolve(__dirname, '..', '..', 'tb-data-host', 'cluster.tigerbeetle');

const deleteLocalLedger = () => {
  if (fs.existsSync(LEDGER_PATH)) {
    fs.rmSync(LEDGER_PATH, { force: true });
    console.log(`Ledger removido em ${LEDGER_PATH}. Reinicie o TigerBeetle para reformatar.`);
  } else {
    console.log('Nenhum ledger local em tb-data-host/ para remover.');
  }
};

async function main() {
  deleteLocalLedger();

  // Garante que as contas básicas existam e que os saldos voltem ao estado inicial.
  await createCoreAccounts();
  await resetAndFundAccounts();
  await closeTbClient();

  console.log('Ledger resetado: contas recriadas e saldos iniciais restabelecidos.');
}

main().catch((err) => {
  console.error('Falha ao resetar ledger e contas:', err);
  throw err;
});
