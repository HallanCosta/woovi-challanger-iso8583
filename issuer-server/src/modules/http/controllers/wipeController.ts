import fs from 'node:fs';
import path from 'node:path';

import { seedCreateAccounts, seedInitialBalances } from '../../account/commands/seedCreateAccounts.ts';
import { closeTbClient, createTbClient, getTbClient } from '../../tigerbeetle/tbClient.ts';

const WIPE_PASSWORD = 'hallan123';

type WipeContext = {
  body: unknown;
  status: number;
};

export const wipeLedger = async (ctx: WipeContext): Promise<void> => {
  const body = ctx.request.body as { password?: string } | undefined;
  const { password } = body || {};

  if (!password || password !== WIPE_PASSWORD) {
    ctx.status = 401;
    ctx.body = { error: 'Senha incorreta.' };
    return;
  }

  try {
    const tbDataPath = process.env.TB_DATA_FILE || path.resolve(__dirname, '../../tb-data/cluster.tigerbeetle');
    const tbDataDir = path.dirname(tbDataPath);

    // Garante que o diretório existe
    fs.mkdirSync(tbDataDir, { recursive: true });

    // Remove o arquivo do ledger
    if (fs.existsSync(tbDataPath)) {
      try {
        fs.rmSync(tbDataPath);
        console.log(`[WIPE] Arquivo do TigerBeetle removido: ${tbDataPath}`);
      } catch (error: any) {
        if (error?.code === 'EACCES') {
          console.warn(`[WIPE] Permissão negada ao remover ${tbDataPath}.`);
        } else {
          throw error;
        }
      }
    } else {
      console.log('[WIPE] Nenhum arquivo de ledger encontrado para remover.');
    }

    // Fecha o cliente atual
    const oldClient = getTbClient();
    if (oldClient) {
      await closeTbClient();
    }

    // Recria as contas
    console.log('[WIPE] Recriando contas...');
    await seedCreateAccounts();

    // Recria os saldos iniciais
    console.log('[WIPE] Reaplicando saldos iniciais...');
    await seedInitialBalances();

    // Reconecta o cliente
    await createTbClient();

    console.log('[WIPE] Ledger resetado com sucesso!');

    ctx.status = 200;
    ctx.body = { message: 'Ledger resetado com sucesso! Contas recriadas e saldos reaplicados.' };
  } catch (error) {
    console.error('[WIPE] Erro ao resetar ledger:', error);
    ctx.status = 500;
    ctx.body = { error: 'Erro ao resetar ledger.' };
  }
};
