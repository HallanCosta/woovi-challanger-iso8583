import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { closeTbClient } from '../src/modules/tigerbeetle/tbClient.ts';
import { seedCreateAccounts, seedInitialBalances } from '../src/modules/account/commands/seedCreateAccounts.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho do arquivo usado pelo container (./tb-data mapeado para /data)
const TB_FILE = process.env.TB_DATA_FILE; //path.resolve(__dirname, '../tb-data/cluster.tigerbeetle');

async function wipeLedger() {
  fs.mkdirSync(path.dirname(TB_FILE), { recursive: true });

  if (!fs.existsSync(TB_FILE)) {
    console.log('[Wipe] Nenhum arquivo de ledger encontrado para remover.');
    return;
  }

  try {
    fs.rmSync(TB_FILE);
    console.log(`[Wipe] Arquivo do TigerBeetle removido: ${TB_FILE}`);
  } catch (error: any) {
    if (error?.code === 'EACCES') {
      console.warn(`[Wipe] Permissão negada ao remover ${TB_FILE}. Pulei a remoção (ledger deve ter sido apagado antes).`);
      return;
    }
    throw error;
  }
}

async function main() {
  console.log('[Wipe] Limpando arquivo do ledger...');
  await wipeLedger();

  console.log('[Wipe] Recriando contas...');
  await seedCreateAccounts();

  console.log('[Wipe] Reaplicando saldos iniciais (10.000,00) via clearing...');
  await seedInitialBalances();

  console.log('[Wipe] Fechando cliente TB pós-seed...');
  await closeTbClient();

  console.log('Ledger resetado: arquivo removido, contas recriadas e saldos iniciais reaplicados.');
}

main()
